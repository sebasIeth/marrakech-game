import { expect } from "chai";
import { ethers } from "hardhat";
import { MarrakechFactory, MarrakechGame } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Simple mock ERC20 for testing
const MOCK_ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];

describe("MarrakechGame", function () {
  let factory: MarrakechFactory;
  let mockUSDC: any;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;

  const STAKE = 1_000_000n; // 1 USDC
  const FEE_BPS = 2000; // 20%

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC to players
    const mintAmount = 100_000_000n; // 100 USDC each
    await mockUSDC.mint(player1.address, mintAmount);
    await mockUSDC.mint(player2.address, mintAmount);
    await mockUSDC.mint(player3.address, mintAmount);

    // Deploy factory
    const Factory = await ethers.getContractFactory("MarrakechFactory");
    factory = await Factory.deploy(
      await mockUSDC.getAddress(),
      STAKE,
      FEE_BPS,
      owner.address
    );
    await factory.waitForDeployment();

    // Approve factory for all players
    const factoryAddr = await factory.getAddress();
    await mockUSDC.connect(player1).approve(factoryAddr, ethers.MaxUint256);
    await mockUSDC.connect(player2).approve(factoryAddr, ethers.MaxUint256);
    await mockUSDC.connect(player3).approve(factoryAddr, ethers.MaxUint256);
  });

  describe("Factory", function () {
    it("should create a game", async function () {
      const tx = await factory.connect(player1).createGame(2);
      const receipt = await tx.wait();

      const gamesCount = await factory.getGamesCount();
      expect(gamesCount).to.equal(1n);

      const games = await factory.getGames();
      expect(games.length).to.equal(1);
    });

    it("should not allow invalid player count", async function () {
      await expect(factory.connect(player1).createGame(1)).to.be.revertedWith("Invalid player count");
      await expect(factory.connect(player1).createGame(5)).to.be.revertedWith("Invalid player count");
    });

    it("should update admin settings", async function () {
      await factory.setStakeAmount(2_000_000n);
      expect(await factory.stakeAmount()).to.equal(2_000_000n);

      await factory.setPlatformFeeBps(1000);
      expect(await factory.platformFeeBps()).to.equal(1000);

      await factory.setPlatformWallet(player1.address);
      expect(await factory.platformWallet()).to.equal(player1.address);
    });
  });

  describe("Game Flow", function () {
    let game: MarrakechGame;
    let gameAddress: string;

    beforeEach(async function () {
      // Create a 2-player game
      const tx = await factory.connect(player1).createGame(2);
      const receipt = await tx.wait();

      const games = await factory.getGames();
      gameAddress = games[0];
      game = await ethers.getContractAt("MarrakechGame", gameAddress);

      // Player 2 approves game contract and joins
      await mockUSDC.connect(player2).approve(gameAddress, ethers.MaxUint256);
    });

    it("should let player 2 join and start the game", async function () {
      await game.connect(player2).joinGame();

      const state = await game.getGameState();
      expect(state._status).to.equal(1); // Active
      expect(state._phase).to.equal(1); // Orient
      expect(state._numPlayers).to.equal(2);
      expect(state._joinedCount).to.equal(2);
    });

    it("should not allow duplicate joins", async function () {
      await expect(game.connect(player1).joinGame()).to.be.revertedWith("Already joined");
    });

    it("should allow orient assam", async function () {
      await game.connect(player2).joinGame();

      // Player 1 (index 0) orients — North is valid from North (straight)
      await game.connect(player1).orientAssam(0); // 0 = North

      const state = await game.getGameState();
      expect(state._phase).to.equal(2); // CommitDice
    });

    it("should not allow opposite direction", async function () {
      await game.connect(player2).joinGame();

      // Player 1 facing North, cannot go South (1)
      await expect(game.connect(player1).orientAssam(1)).to.be.revertedWith("Invalid direction");
    });

    it("should handle commit-reveal dice flow", async function () {
      await game.connect(player2).joinGame();
      await game.connect(player1).orientAssam(0); // Orient North

      // Commit
      const salt = 12345n;
      const commitHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [salt]));
      await game.connect(player1).commitDice(commitHash);

      const state1 = await game.getGameState();
      expect(state1._phase).to.equal(3); // RevealDice

      // Mine a block
      await ethers.provider.send("evm_mine", []);

      // Reveal
      await game.connect(player1).revealDice(salt);

      const state2 = await game.getGameState();
      // Should be in Tribute, Place, or BorderChoice after reveal
      expect([4, 5, 6].includes(Number(state2._phase))).to.be.true;
    });

    it("should handle full turn: orient → commit → reveal → tribute → place", async function () {
      await game.connect(player2).joinGame();

      // Orient East (valid from North)
      await game.connect(player1).orientAssam(3); // E

      // Commit dice
      const salt = 99999n;
      const commitHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [salt]));
      await game.connect(player1).commitDice(commitHash);

      // Mine block
      await ethers.provider.send("evm_mine", []);

      // Reveal
      await game.connect(player1).revealDice(salt);

      // Handle border choices if any
      let state = await game.getGameState();
      while (Number(state._phase) === 4) { // BorderChoice
        const bcInfo = await game.getBorderChoiceInfo();
        // Choose a valid perpendicular direction
        const exitDir = Number(bcInfo.exitDirection);
        let chooseDir;
        if (exitDir === 0 || exitDir === 1) { // N or S → choose E or W
          chooseDir = 3; // E
        } else { // E or W → choose N or S
          chooseDir = 0; // N
        }

        try {
          await game.connect(player1).chooseBorderDirection(chooseDir);
        } catch {
          // Try the other perpendicular
          chooseDir = exitDir === 0 || exitDir === 1 ? 2 : 1;
          await game.connect(player1).chooseBorderDirection(chooseDir);
        }
        state = await game.getGameState();
      }

      // Should be in Tribute phase
      expect(Number(state._phase)).to.equal(5); // Tribute

      // Acknowledge tribute
      await game.connect(player1).acknowledgeTribute();

      state = await game.getGameState();
      // Now in Place phase (or GameOver if eliminated)
      if (Number(state._phase) === 6) { // Place
        // Get Assam position for valid placement
        const assamInfo = await game.getAssam();
        const assamRow = Number(assamInfo.row);
        const assamCol = Number(assamInfo.col);

        // Try to place a carpet adjacent to Assam
        let placed = false;
        const adjacents = [
          [assamRow - 1, assamCol],
          [assamRow + 1, assamCol],
          [assamRow, assamCol - 1],
          [assamRow, assamCol + 1],
        ];

        for (const [r, c] of adjacents) {
          if (r < 0 || r >= 7 || c < 0 || c >= 7) continue;
          // Try extending in each direction
          const extensions = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
          ];
          for (const [er, ec] of extensions) {
            if (er < 0 || er >= 7 || ec < 0 || ec >= 7) continue;
            if (er === assamRow && ec === assamCol) continue;
            if (r === er && c === ec) continue;
            // Manhattan distance must be 1
            if (Math.abs(r - er) + Math.abs(c - ec) !== 1) continue;

            try {
              await game.connect(player1).placeCarpet(r, c, er, ec);
              placed = true;
              break;
            } catch {
              continue;
            }
          }
          if (placed) break;
        }

        expect(placed).to.be.true;

        state = await game.getGameState();
        // Should be orient phase for player 2 now
        expect(Number(state._phase)).to.equal(1); // Orient
        expect(Number(state._currentPlayerIndex)).to.equal(1); // Player 2
      }
    });

    it("should handle game cancellation after timeout", async function () {
      // Fast forward 1 hour
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      const balBefore = await mockUSDC.balanceOf(player1.address);
      await game.cancelGame();
      const balAfter = await mockUSDC.balanceOf(player1.address);

      // Player 1 should get refund
      expect(balAfter - balBefore).to.equal(STAKE);

      const state = await game.getGameState();
      expect(state._status).to.equal(3); // Cancelled
    });

    it("should return correct board state", async function () {
      const board = await game.getBoard();
      // All cells should be empty (0xFF = 255)
      for (let i = 0; i < 49; i++) {
        expect(board.playerIds[i]).to.equal(255);
      }
    });

    it("should return correct player info", async function () {
      const p1 = await game.getPlayer(0);
      expect(p1.wallet).to.equal(player1.address);
      expect(p1.dirhams).to.equal(30);
      expect(p1.carpetsRemaining).to.equal(24); // 2 players = 24 carpets each
      expect(p1.joined).to.be.true;
    });
  });
});
