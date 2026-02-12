// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MarrakechGame {
    // ── Enums ──
    enum Direction { N, S, E, W }
    enum Phase { WaitingForPlayers, Orient, CommitDice, RevealDice, BorderChoice, Tribute, Place, GameOver }
    enum GameStatus { Waiting, Active, Finished, Cancelled }

    // ── Structs ──
    struct Player {
        address wallet;
        uint16 dirhams;
        uint8 carpetsRemaining;
        bool eliminated;
        bool joined;
    }

    struct Assam {
        uint8 row;
        uint8 col;
        Direction direction;
    }

    struct DiceCommit {
        bytes32 commitHash;
        uint256 commitBlock;
    }

    struct BorderChoiceInfo {
        uint8 row;
        uint8 col;
        Direction exitDirection;
        uint8 remainingSteps;
    }

    struct TributeInfo {
        uint8 fromPlayerIdx;
        uint8 toPlayerIdx;
        uint16 amount;
    }

    // ── Constants ──
    uint8 constant BOARD_SIZE = 7;
    uint8 constant TOTAL_CELLS = 49;
    uint16 constant STARTING_DIRHAMS = 30;
    uint8[6] private DICE_FACES = [1, 2, 2, 3, 3, 4];
    uint8 constant EMPTY_CELL = 0xFF;
    uint8 constant NEUTRALIZED_CELL = 0xFE;

    // Carpets per player count: index 2=24, 3=15, 4=12
    function _carpetsPerPlayer(uint8 numP) internal pure returns (uint8) {
        if (numP == 2) return 24;
        if (numP == 3) return 15;
        return 12;
    }

    // ── State ──
    IERC20 public immutable usdc;
    uint256 public immutable stakeAmount;
    uint16 public immutable platformFeeBps;
    address public immutable platformWallet;
    address public immutable factory;

    uint8 public numPlayers;
    uint8 public joinedCount;
    GameStatus public status;
    Phase public phase;
    uint8 public currentPlayerIndex;
    uint16 public turnNumber;

    Player[4] public players;
    Assam public assam;

    // Board: playerIds per cell (EMPTY_CELL=empty, NEUTRALIZED_CELL=neutralized, 0-3=player)
    uint8[49] public boardPlayerIds;
    // Board: carpetIds per cell (sequential ID per player's carpet)
    uint8[49] public boardCarpetIds;

    DiceCommit public diceCommit;
    BorderChoiceInfo public borderChoice;
    TributeInfo public currentTribute;
    uint8 public lastDiceValue;

    uint256 public lastActionBlock;
    uint256 public createdAt;

    // ── Events ──
    event PlayerJoined(uint8 indexed playerIndex, address wallet);
    event GameStarted();
    event AssamOriented(uint8 indexed playerIndex, Direction direction);
    event DiceCommitted(uint8 indexed playerIndex, bytes32 commitHash);
    event DiceRevealed(uint8 indexed playerIndex, uint8 value);
    event AssamMoved(uint8 row, uint8 col, Direction direction);
    event BorderChoiceRequired(uint8 row, uint8 col, Direction exitDirection, uint8 remainingSteps);
    event BorderDirectionChosen(uint8 indexed playerIndex, Direction direction);
    event TributeCalculated(uint8 fromPlayer, uint8 toPlayer, uint16 amount);
    event TributeAcknowledged(uint8 indexed playerIndex);
    event CarpetPlaced(uint8 indexed playerIndex, uint8 r1, uint8 c1, uint8 r2, uint8 c2);
    event PlayerEliminated(uint8 indexed playerIndex);
    event GameFinished(uint8 winnerIndex, address winnerWallet);
    event GameCancelled();
    event PrizeDistributed(address winner, uint256 amount, address platform, uint256 fee);
    event TimeoutClaimed(uint8 indexed playerIndex);

    // ── Modifiers ──
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier inPhase(Phase p) {
        require(phase == p, "Wrong phase");
        _;
    }

    modifier onlyCurrentPlayer() {
        require(status == GameStatus.Active, "Game not active");
        require(players[currentPlayerIndex].wallet == msg.sender, "Not your turn");
        _;
    }

    modifier gameActive() {
        require(status == GameStatus.Active, "Game not active");
        _;
    }

    // ── Constructor ──
    constructor(
        address _usdc,
        uint256 _stakeAmount,
        uint16 _platformFeeBps,
        address _platformWallet,
        uint8 _numPlayers,
        address _creator
    ) {
        require(_numPlayers >= 2 && _numPlayers <= 4, "Invalid player count");

        usdc = IERC20(_usdc);
        stakeAmount = _stakeAmount;
        platformFeeBps = _platformFeeBps;
        platformWallet = _platformWallet;
        factory = msg.sender;
        numPlayers = _numPlayers;
        status = GameStatus.Waiting;
        phase = Phase.WaitingForPlayers;
        createdAt = block.timestamp;
        lastActionBlock = block.number;

        // Creator is player 0
        players[0] = Player({
            wallet: _creator,
            dirhams: STARTING_DIRHAMS,
            carpetsRemaining: _carpetsPerPlayer(_numPlayers),
            eliminated: false,
            joined: true
        });
        joinedCount = 1;

        // Init board as empty
        for (uint8 i = 0; i < TOTAL_CELLS; i++) {
            boardPlayerIds[i] = EMPTY_CELL;
            boardCarpetIds[i] = 0;
        }

        // Assam starts at center (3,3) facing North
        assam = Assam(3, 3, Direction.N);

        emit PlayerJoined(0, _creator);
    }

    // ── Join Game ──
    function joinGame() external inPhase(Phase.WaitingForPlayers) {
        require(joinedCount < numPlayers, "Game full");
        require(!_isPlayer(msg.sender), "Already joined");

        // Transfer USDC stake
        require(usdc.transferFrom(msg.sender, address(this), stakeAmount), "USDC transfer failed");

        uint8 idx = joinedCount;
        players[idx] = Player({
            wallet: msg.sender,
            dirhams: STARTING_DIRHAMS,
            carpetsRemaining: _carpetsPerPlayer(numPlayers),
            eliminated: false,
            joined: true
        });
        joinedCount++;

        emit PlayerJoined(idx, msg.sender);

        // Start game when all players joined
        if (joinedCount == numPlayers) {
            status = GameStatus.Active;
            phase = Phase.Orient;
            currentPlayerIndex = 0;
            turnNumber = 1;
            lastActionBlock = block.number;
            emit GameStarted();
        }
    }

    // ── Orient Assam ──
    function orientAssam(Direction dir) external onlyCurrentPlayer inPhase(Phase.Orient) {
        require(_isValidDirection(assam.direction, dir), "Invalid direction");

        assam.direction = dir;
        phase = Phase.CommitDice;
        lastActionBlock = block.number;

        emit AssamOriented(currentPlayerIndex, dir);
    }

    // ── Commit Dice ──
    function commitDice(bytes32 hash) external onlyCurrentPlayer inPhase(Phase.CommitDice) {
        diceCommit = DiceCommit(hash, block.number);
        phase = Phase.RevealDice;
        lastActionBlock = block.number;

        emit DiceCommitted(currentPlayerIndex, hash);
    }

    // ── Reveal Dice ──
    function revealDice(uint256 salt) external onlyCurrentPlayer inPhase(Phase.RevealDice) {
        require(block.number > diceCommit.commitBlock, "Must wait at least 1 block");
        require(block.number <= diceCommit.commitBlock + 256, "Commit expired");
        require(keccak256(abi.encodePacked(salt)) == diceCommit.commitHash, "Invalid salt");

        // Generate random using blockhash + salt
        bytes32 randomness = keccak256(abi.encodePacked(blockhash(diceCommit.commitBlock), salt));
        uint8 diceValue = DICE_FACES[uint8(uint256(randomness) % 6)];
        lastDiceValue = diceValue;

        emit DiceRevealed(currentPlayerIndex, diceValue);

        // Move Assam
        _moveAssam(diceValue);
        lastActionBlock = block.number;
    }

    // ── Choose Border Direction ──
    function chooseBorderDirection(Direction dir) external onlyCurrentPlayer inPhase(Phase.BorderChoice) {
        require(_isValidBorderChoice(dir), "Invalid border choice");

        emit BorderDirectionChosen(currentPlayerIndex, dir);

        // Apply U-turn: move one cell in chosen direction, reverse facing
        int8[2] memory vec = _directionVector(dir);
        uint8 newRow = uint8(int8(borderChoice.row) + vec[0]);
        uint8 newCol = uint8(int8(borderChoice.col) + vec[1]);

        // Reverse the facing direction
        Direction newFacing = _oppositeDirection(borderChoice.exitDirection);
        assam = Assam(newRow, newCol, newFacing);
        uint8 remaining = borderChoice.remainingSteps - 1;

        if (remaining == 0) {
            // Movement done, calculate tribute
            _calculateAndSetTribute();
        } else {
            // Continue movement
            _continueMovement(remaining);
        }
        lastActionBlock = block.number;
    }

    // ── Acknowledge Tribute ──
    function acknowledgeTribute() external onlyCurrentPlayer inPhase(Phase.Tribute) {
        _processTribute();
        lastActionBlock = block.number;

        emit TributeAcknowledged(currentPlayerIndex);
    }

    // ── Place Carpet ──
    function placeCarpet(uint8 r1, uint8 c1, uint8 r2, uint8 c2) external onlyCurrentPlayer inPhase(Phase.Place) {
        require(_isValidPlacement(r1, c1, r2, c2), "Invalid placement");

        Player storage player = players[currentPlayerIndex];
        uint8 carpetNumber = _carpetsPerPlayer(numPlayers) - player.carpetsRemaining + 1;

        // Place carpet on board
        uint8 idx1 = r1 * BOARD_SIZE + c1;
        uint8 idx2 = r2 * BOARD_SIZE + c2;
        boardPlayerIds[idx1] = currentPlayerIndex;
        boardCarpetIds[idx1] = carpetNumber;
        boardPlayerIds[idx2] = currentPlayerIndex;
        boardCarpetIds[idx2] = carpetNumber;

        player.carpetsRemaining--;

        emit CarpetPlaced(currentPlayerIndex, r1, c1, r2, c2);

        // Check game over
        if (_allCarpetsPlaced()) {
            _endGame();
        } else {
            _advanceToNextPlayer();
        }
        lastActionBlock = block.number;
    }

    // ── Cancel Game (if not enough players after timeout) ──
    function cancelGame() external {
        require(status == GameStatus.Waiting, "Game not waiting");
        require(block.timestamp >= createdAt + 1 hours, "Too early to cancel");

        status = GameStatus.Cancelled;
        phase = Phase.GameOver;

        // Refund all joined players
        for (uint8 i = 0; i < joinedCount; i++) {
            if (players[i].joined) {
                usdc.transfer(players[i].wallet, stakeAmount);
            }
        }

        emit GameCancelled();
    }

    // ── Claim Timeout (if current player doesn't act within 256 blocks) ──
    function claimTimeout() external gameActive {
        require(block.number > lastActionBlock + 256, "Not timed out yet");

        uint8 timedOutPlayer = currentPlayerIndex;
        _eliminatePlayer(timedOutPlayer);

        emit TimeoutClaimed(timedOutPlayer);

        // Check if game should end
        uint8 activePlayers = _countActivePlayers();
        if (activePlayers <= 1) {
            _endGame();
        } else {
            _advanceToNextPlayer();
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //                     INTERNAL FUNCTIONS
    // ══════════════════════════════════════════════════════════════════

    function _moveAssam(uint8 steps) internal {
        uint8 remaining = steps;

        while (remaining > 0) {
            int8[2] memory vec = _directionVector(assam.direction);
            int8 nextRow = int8(assam.row) + vec[0];
            int8 nextCol = int8(assam.col) + vec[1];

            if (_isInBounds(nextRow, nextCol)) {
                assam.row = uint8(nextRow);
                assam.col = uint8(nextCol);
                remaining--;
            } else {
                // Hit border — pause for player choice
                borderChoice = BorderChoiceInfo(assam.row, assam.col, assam.direction, remaining);
                phase = Phase.BorderChoice;

                emit AssamMoved(assam.row, assam.col, assam.direction);
                emit BorderChoiceRequired(assam.row, assam.col, assam.direction, remaining);
                return;
            }
        }

        emit AssamMoved(assam.row, assam.col, assam.direction);

        // Movement completed — calculate tribute
        _calculateAndSetTribute();
    }

    function _continueMovement(uint8 steps) internal {
        uint8 remaining = steps;

        while (remaining > 0) {
            int8[2] memory vec = _directionVector(assam.direction);
            int8 nextRow = int8(assam.row) + vec[0];
            int8 nextCol = int8(assam.col) + vec[1];

            if (_isInBounds(nextRow, nextCol)) {
                assam.row = uint8(nextRow);
                assam.col = uint8(nextCol);
                remaining--;
            } else {
                // Hit border again
                borderChoice = BorderChoiceInfo(assam.row, assam.col, assam.direction, remaining);
                phase = Phase.BorderChoice;

                emit AssamMoved(assam.row, assam.col, assam.direction);
                emit BorderChoiceRequired(assam.row, assam.col, assam.direction, remaining);
                return;
            }
        }

        emit AssamMoved(assam.row, assam.col, assam.direction);
        _calculateAndSetTribute();
    }

    function _calculateAndSetTribute() internal {
        uint8 cellIdx = assam.row * BOARD_SIZE + assam.col;
        uint8 cellOwner = boardPlayerIds[cellIdx];

        if (cellOwner == EMPTY_CELL || cellOwner == NEUTRALIZED_CELL || cellOwner == currentPlayerIndex) {
            // No tribute needed — skip to Place
            currentTribute = TributeInfo(currentPlayerIndex, currentPlayerIndex, 0);
            phase = Phase.Tribute;
            emit TributeCalculated(currentPlayerIndex, currentPlayerIndex, 0);
            return;
        }

        // Count connected cells via BFS
        uint16 connectedCount = _floodFillCount(assam.row, assam.col, cellOwner);
        currentTribute = TributeInfo(currentPlayerIndex, cellOwner, connectedCount);
        phase = Phase.Tribute;

        emit TributeCalculated(currentPlayerIndex, cellOwner, connectedCount);
    }

    function _processTribute() internal {
        if (currentTribute.amount > 0 && currentTribute.fromPlayerIdx != currentTribute.toPlayerIdx) {
            Player storage from = players[currentTribute.fromPlayerIdx];
            Player storage to = players[currentTribute.toPlayerIdx];

            uint16 actualPayment = currentTribute.amount > from.dirhams ? from.dirhams : currentTribute.amount;
            from.dirhams -= actualPayment;
            to.dirhams += actualPayment;

            // Check elimination
            if (from.dirhams == 0) {
                _eliminatePlayer(currentTribute.fromPlayerIdx);

                uint8 activePlayers = _countActivePlayers();
                if (activePlayers <= 1) {
                    _endGame();
                    return;
                }

                // Eliminated player can't place — skip to next
                if (currentTribute.fromPlayerIdx == currentPlayerIndex) {
                    _advanceToNextPlayer();
                    return;
                }
            }
        }

        // Move to place phase
        phase = Phase.Place;
    }

    function _eliminatePlayer(uint8 playerIdx) internal {
        players[playerIdx].eliminated = true;
        players[playerIdx].dirhams = 0;

        // Neutralize this player's carpets
        for (uint8 i = 0; i < TOTAL_CELLS; i++) {
            if (boardPlayerIds[i] == playerIdx) {
                boardPlayerIds[i] = NEUTRALIZED_CELL;
            }
        }

        emit PlayerEliminated(playerIdx);
    }

    function _advanceToNextPlayer() internal {
        uint8 nextIdx = (currentPlayerIndex + 1) % numPlayers;
        uint8 checked = 0;

        // Skip eliminated players
        while (players[nextIdx].eliminated && checked < numPlayers) {
            nextIdx = (nextIdx + 1) % numPlayers;
            checked++;
        }

        // Skip players with no carpets
        checked = 0;
        while (players[nextIdx].carpetsRemaining == 0 && !players[nextIdx].eliminated && checked < numPlayers) {
            nextIdx = (nextIdx + 1) % numPlayers;
            checked++;
        }

        // Check if all active players are out of carpets
        if (_noActivePlayerHasCarpets()) {
            _endGame();
            return;
        }

        currentPlayerIndex = nextIdx;
        phase = Phase.Orient;
        turnNumber++;
    }

    function _endGame() internal {
        status = GameStatus.Finished;
        phase = Phase.GameOver;

        // Find winner (highest dirhams + visible cells)
        uint8 winnerIdx = 0;
        uint16 highestScore = 0;

        for (uint8 i = 0; i < numPlayers; i++) {
            if (players[i].eliminated) continue;
            uint16 visibleCells = _countVisibleCells(i);
            uint16 score = players[i].dirhams + visibleCells;
            if (score > highestScore) {
                highestScore = score;
                winnerIdx = i;
            }
        }

        emit GameFinished(winnerIdx, players[winnerIdx].wallet);

        // Distribute prize
        _distributePrize(winnerIdx);
    }

    function _distributePrize(uint8 winnerIdx) internal {
        uint256 totalPool = stakeAmount * numPlayers;
        uint256 platformFee = (totalPool * platformFeeBps) / 10000;
        uint256 winnerPrize = totalPool - platformFee;

        if (winnerPrize > 0) {
            usdc.transfer(players[winnerIdx].wallet, winnerPrize);
        }
        if (platformFee > 0) {
            usdc.transfer(platformWallet, platformFee);
        }

        emit PrizeDistributed(players[winnerIdx].wallet, winnerPrize, platformWallet, platformFee);
    }

    function _allCarpetsPlaced() internal view returns (bool) {
        for (uint8 i = 0; i < numPlayers; i++) {
            if (!players[i].eliminated && players[i].carpetsRemaining > 0) {
                return false;
            }
        }
        return true;
    }

    function _noActivePlayerHasCarpets() internal view returns (bool) {
        for (uint8 i = 0; i < numPlayers; i++) {
            if (!players[i].eliminated && players[i].carpetsRemaining > 0) {
                return false;
            }
        }
        return true;
    }

    function _countActivePlayers() internal view returns (uint8) {
        uint8 count = 0;
        for (uint8 i = 0; i < numPlayers; i++) {
            if (!players[i].eliminated) count++;
        }
        return count;
    }

    function _countVisibleCells(uint8 playerIdx) internal view returns (uint16) {
        uint16 count = 0;
        for (uint8 i = 0; i < TOTAL_CELLS; i++) {
            if (boardPlayerIds[i] == playerIdx) count++;
        }
        return count;
    }

    // ── BFS Flood Fill ──
    function _floodFillCount(uint8 startRow, uint8 startCol, uint8 targetPlayer) internal view returns (uint16) {
        // BFS with a fixed-size queue (max 49 cells)
        bool[49] memory visited;
        uint8[49] memory queue;
        uint8 head = 0;
        uint8 tail = 0;
        uint16 count = 0;

        uint8 startIdx = startRow * BOARD_SIZE + startCol;
        queue[tail++] = startIdx;
        visited[startIdx] = true;

        while (head < tail) {
            uint8 current = queue[head++];
            uint8 row = current / BOARD_SIZE;
            uint8 col = current % BOARD_SIZE;

            if (boardPlayerIds[current] != targetPlayer) continue;
            count++;

            // Check 4 neighbors
            if (row > 0) {
                uint8 n = (row - 1) * BOARD_SIZE + col;
                if (!visited[n]) { visited[n] = true; queue[tail++] = n; }
            }
            if (row < BOARD_SIZE - 1) {
                uint8 n = (row + 1) * BOARD_SIZE + col;
                if (!visited[n]) { visited[n] = true; queue[tail++] = n; }
            }
            if (col > 0) {
                uint8 n = row * BOARD_SIZE + (col - 1);
                if (!visited[n]) { visited[n] = true; queue[tail++] = n; }
            }
            if (col < BOARD_SIZE - 1) {
                uint8 n = row * BOARD_SIZE + (col + 1);
                if (!visited[n]) { visited[n] = true; queue[tail++] = n; }
            }
        }

        return count;
    }

    // ── Placement Validation ──
    function _isValidPlacement(uint8 r1, uint8 c1, uint8 r2, uint8 c2) internal view returns (bool) {
        // Both cells must be in bounds
        if (r1 >= BOARD_SIZE || c1 >= BOARD_SIZE || r2 >= BOARD_SIZE || c2 >= BOARD_SIZE) return false;

        // Cells must be adjacent (Manhattan distance = 1)
        uint8 dist;
        if (r1 > r2) dist = r1 - r2; else dist = r2 - r1;
        if (c1 > c2) dist += c1 - c2; else dist += c2 - c1;
        if (dist != 1) return false;

        // Neither cell can be Assam's position
        if (r1 == assam.row && c1 == assam.col) return false;
        if (r2 == assam.row && c2 == assam.col) return false;

        // At least one cell must be adjacent to Assam
        bool adj1 = _isAdjacentToAssam(r1, c1);
        bool adj2 = _isAdjacentToAssam(r2, c2);
        if (!adj1 && !adj2) return false;

        // Cannot fully cover a single rival carpet
        uint8 idx1 = r1 * BOARD_SIZE + c1;
        uint8 idx2 = r2 * BOARD_SIZE + c2;
        uint8 owner1 = boardPlayerIds[idx1];
        uint8 owner2 = boardPlayerIds[idx2];
        uint8 carpet1 = boardCarpetIds[idx1];
        uint8 carpet2 = boardCarpetIds[idx2];

        if (owner1 != EMPTY_CELL && owner1 != NEUTRALIZED_CELL &&
            owner2 != EMPTY_CELL && owner2 != NEUTRALIZED_CELL &&
            owner1 == owner2 && carpet1 == carpet2 &&
            owner1 != currentPlayerIndex) {
            return false;
        }

        // Current player must have carpets remaining
        if (players[currentPlayerIndex].carpetsRemaining == 0) return false;

        return true;
    }

    function _isAdjacentToAssam(uint8 r, uint8 c) internal view returns (bool) {
        if (r == assam.row && c == assam.col) return false;
        uint8 dist;
        if (r > assam.row) dist = r - assam.row; else dist = assam.row - r;
        if (c > assam.col) dist += c - assam.col; else dist += assam.col - c;
        return dist == 1;
    }

    // ── Direction Helpers ──
    function _isValidDirection(Direction current, Direction chosen) internal pure returns (bool) {
        // Cannot go in the opposite direction
        if (current == Direction.N && chosen == Direction.S) return false;
        if (current == Direction.S && chosen == Direction.N) return false;
        if (current == Direction.E && chosen == Direction.W) return false;
        if (current == Direction.W && chosen == Direction.E) return false;
        return true;
    }

    function _isValidBorderChoice(Direction dir) internal view returns (bool) {
        // Must be perpendicular to exit direction
        Direction exit = borderChoice.exitDirection;
        bool isPerpendicular;
        if (exit == Direction.N || exit == Direction.S) {
            isPerpendicular = (dir == Direction.E || dir == Direction.W);
        } else {
            isPerpendicular = (dir == Direction.N || dir == Direction.S);
        }
        if (!isPerpendicular) return false;

        // New position must be in bounds
        int8[2] memory vec = _directionVector(dir);
        int8 newRow = int8(borderChoice.row) + vec[0];
        int8 newCol = int8(borderChoice.col) + vec[1];
        return _isInBounds(newRow, newCol);
    }

    function _oppositeDirection(Direction d) internal pure returns (Direction) {
        if (d == Direction.N) return Direction.S;
        if (d == Direction.S) return Direction.N;
        if (d == Direction.E) return Direction.W;
        return Direction.E;
    }

    function _directionVector(Direction d) internal pure returns (int8[2] memory) {
        if (d == Direction.N) return [int8(-1), int8(0)];
        if (d == Direction.S) return [int8(1), int8(0)];
        if (d == Direction.E) return [int8(0), int8(1)];
        return [int8(0), int8(-1)]; // W
    }

    function _isInBounds(int8 row, int8 col) internal pure returns (bool) {
        return row >= 0 && row < int8(BOARD_SIZE) && col >= 0 && col < int8(BOARD_SIZE);
    }

    function _isPlayer(address addr) internal view returns (bool) {
        for (uint8 i = 0; i < joinedCount; i++) {
            if (players[i].wallet == addr) return true;
        }
        return false;
    }

    // ══════════════════════════════════════════════════════════════════
    //                          VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════════════════

    function getBoard() external view returns (uint8[49] memory playerIds, uint8[49] memory carpetIds) {
        return (boardPlayerIds, boardCarpetIds);
    }

    function getPlayer(uint8 idx) external view returns (
        address wallet,
        uint16 dirhams,
        uint8 carpetsRemaining,
        bool eliminated,
        bool joined
    ) {
        Player storage p = players[idx];
        return (p.wallet, p.dirhams, p.carpetsRemaining, p.eliminated, p.joined);
    }

    function getAssam() external view returns (uint8 row, uint8 col, Direction direction) {
        return (assam.row, assam.col, assam.direction);
    }

    function getGameState() external view returns (
        GameStatus _status,
        Phase _phase,
        uint8 _currentPlayerIndex,
        uint16 _turnNumber,
        uint8 _numPlayers,
        uint8 _joinedCount,
        uint8 _lastDiceValue
    ) {
        return (status, phase, currentPlayerIndex, turnNumber, numPlayers, joinedCount, lastDiceValue);
    }

    function getFullState() external view returns (
        // Game info
        GameStatus _status,
        Phase _phase,
        uint8 _currentPlayerIndex,
        uint16 _turnNumber,
        uint8 _numPlayers,
        uint8 _joinedCount,
        uint8 _lastDiceValue,
        // Assam
        uint8 _assamRow,
        uint8 _assamCol,
        Direction _assamDir,
        // Board
        uint8[49] memory _boardPlayerIds,
        uint8[49] memory _boardCarpetIds
    ) {
        return (
            status, phase, currentPlayerIndex, turnNumber,
            numPlayers, joinedCount, lastDiceValue,
            assam.row, assam.col, assam.direction,
            boardPlayerIds, boardCarpetIds
        );
    }

    function getPlayers() external view returns (
        address[4] memory wallets,
        uint16[4] memory dirhamsArr,
        uint8[4] memory carpetsArr,
        bool[4] memory eliminatedArr,
        bool[4] memory joinedArr
    ) {
        for (uint8 i = 0; i < 4; i++) {
            wallets[i] = players[i].wallet;
            dirhamsArr[i] = players[i].dirhams;
            carpetsArr[i] = players[i].carpetsRemaining;
            eliminatedArr[i] = players[i].eliminated;
            joinedArr[i] = players[i].joined;
        }
    }

    function getTributeInfo() external view returns (uint8 fromPlayer, uint8 toPlayer, uint16 amount) {
        return (currentTribute.fromPlayerIdx, currentTribute.toPlayerIdx, currentTribute.amount);
    }

    function getBorderChoiceInfo() external view returns (
        uint8 row, uint8 col, Direction exitDirection, uint8 remainingSteps
    ) {
        return (borderChoice.row, borderChoice.col, borderChoice.exitDirection, borderChoice.remainingSteps);
    }

    function getPlayerIndex(address wallet) external view returns (int8) {
        for (uint8 i = 0; i < numPlayers; i++) {
            if (players[i].wallet == wallet) return int8(i);
        }
        return -1;
    }
}
