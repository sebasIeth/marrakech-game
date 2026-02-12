// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MarrakechGame.sol";

contract MarrakechFactory is Ownable {
    IERC20 public usdc;
    uint256 public stakeAmount; // 1 USDC = 1_000_000 (6 decimals)
    uint16 public platformFeeBps; // 2000 = 20%
    address public platformWallet;

    address[] public games;
    mapping(address => bool) public isGame;

    // Track active games (not finished/cancelled)
    mapping(address => bool) public activeGames;

    event GameCreated(address indexed game, address indexed creator, uint8 numPlayers);
    event StakeAmountUpdated(uint256 newAmount);
    event PlatformFeeBpsUpdated(uint16 newBps);
    event PlatformWalletUpdated(address newWallet);

    constructor(
        address _usdc,
        uint256 _stakeAmount,
        uint16 _platformFeeBps,
        address _platformWallet
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        stakeAmount = _stakeAmount;
        platformFeeBps = _platformFeeBps;
        platformWallet = _platformWallet;
    }

    function createGame(uint8 numPlayers) external returns (address) {
        require(numPlayers >= 2 && numPlayers <= 4, "Invalid player count");

        // Transfer USDC from creator to this contract temporarily
        require(usdc.transferFrom(msg.sender, address(this), stakeAmount), "USDC transfer failed");

        // Create new game
        MarrakechGame game = new MarrakechGame(
            address(usdc),
            stakeAmount,
            platformFeeBps,
            platformWallet,
            numPlayers,
            msg.sender
        );

        // Forward the USDC to the game contract
        usdc.transfer(address(game), stakeAmount);

        address gameAddr = address(game);
        games.push(gameAddr);
        isGame[gameAddr] = true;
        activeGames[gameAddr] = true;

        emit GameCreated(gameAddr, msg.sender, numPlayers);
        return gameAddr;
    }

    // ── Admin Functions ──
    function setStakeAmount(uint256 _stakeAmount) external onlyOwner {
        stakeAmount = _stakeAmount;
        emit StakeAmountUpdated(_stakeAmount);
    }

    function setPlatformFeeBps(uint16 _platformFeeBps) external onlyOwner {
        require(_platformFeeBps <= 5000, "Fee too high"); // Max 50%
        platformFeeBps = _platformFeeBps;
        emit PlatformFeeBpsUpdated(_platformFeeBps);
    }

    function setPlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Invalid wallet");
        platformWallet = _platformWallet;
        emit PlatformWalletUpdated(_platformWallet);
    }

    // ── View Functions ──
    function getGames() external view returns (address[] memory) {
        return games;
    }

    function getActiveGames() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < games.length; i++) {
            MarrakechGame game = MarrakechGame(games[i]);
            if (game.status() == MarrakechGame.GameStatus.Waiting ||
                game.status() == MarrakechGame.GameStatus.Active) {
                count++;
            }
        }

        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < games.length; i++) {
            MarrakechGame game = MarrakechGame(games[i]);
            if (game.status() == MarrakechGame.GameStatus.Waiting ||
                game.status() == MarrakechGame.GameStatus.Active) {
                active[idx++] = games[i];
            }
        }
        return active;
    }

    function getGamesCount() external view returns (uint256) {
        return games.length;
    }

    function getFactoryInfo() external view returns (
        address _usdc,
        uint256 _stakeAmount,
        uint16 _platformFeeBps,
        address _platformWallet,
        uint256 _gamesCount
    ) {
        return (address(usdc), stakeAmount, platformFeeBps, platformWallet, games.length);
    }
}
