// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PongTournament {
    
    struct TournamentScore {
        string tournamentId;
        uint256 playerOneId;
        uint256 playerTwoId;
        string playerOneName;
        string playerTwoName;
        string score;
        string gameMode;
        uint256 timestamp;
    }
    
    // Mapping from tournament ID to tournament score
    mapping(string => TournamentScore) private tournamentScores;
    
    // Array to keep track of all tournament IDs
    string[] private tournamentIds;
    
    // Mapping to check if tournament ID already exists
    mapping(string => bool) private tournamentExists;
    
    // Events
    event TournamentScoreStored(
        string indexed tournamentId,
        uint256 playerOneId,
        uint256 playerTwoId,
        string playerOneName,
        string playerTwoName,
        string score,
        string gameMode,
        uint256 timestamp
    );
    
    // Owner of the contract
    address private owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Store a tournament score on the blockchain
     * @param _tournamentId Unique identifier for the tournament
     * @param _playerOneId ID of the first player
     * @param _playerTwoId ID of the second player
     * @param _playerOneName Name of the first player
     * @param _playerTwoName Name of the second player
     * @param _score The game score (e.g., "3-2")
     * @param _gameMode The game mode (e.g., "pvp", "pvc")
     */
    function storeTournamentScore(
        string memory _tournamentId,
        uint256 _playerOneId,
        uint256 _playerTwoId,
        string memory _playerOneName,
        string memory _playerTwoName,
        string memory _score,
        string memory _gameMode
    ) public {
        require(bytes(_tournamentId).length > 0, "Tournament ID cannot be empty");
        require(bytes(_playerOneName).length > 0, "Player one name cannot be empty");
        require(bytes(_playerTwoName).length > 0, "Player two name cannot be empty");
        require(bytes(_score).length > 0, "Score cannot be empty");
        require(_playerOneId != _playerTwoId, "Players must be different");
        
        // If tournament doesn't exist, add it to the list
        if (!tournamentExists[_tournamentId]) {
            tournamentIds.push(_tournamentId);
            tournamentExists[_tournamentId] = true;
        }
        
        // Store the tournament score
        tournamentScores[_tournamentId] = TournamentScore({
            tournamentId: _tournamentId,
            playerOneId: _playerOneId,
            playerTwoId: _playerTwoId,
            playerOneName: _playerOneName,
            playerTwoName: _playerTwoName,
            score: _score,
            gameMode: _gameMode,
            timestamp: block.timestamp
        });
        
        emit TournamentScoreStored(
            _tournamentId,
            _playerOneId,
            _playerTwoId,
            _playerOneName,
            _playerTwoName,
            _score,
            _gameMode,
            block.timestamp
        );
    }
    
    /**
     * @dev Get a tournament score by tournament ID
     * @param _tournamentId The tournament ID to query
     * @return The tournament score struct
     */
    function getTournamentScore(string memory _tournamentId) 
        public 
        view 
        returns (TournamentScore memory) 
    {
        require(tournamentExists[_tournamentId], "Tournament does not exist");
        return tournamentScores[_tournamentId];
    }
    
    /**
     * @dev Get all tournament IDs
     * @return Array of all tournament IDs
     */
    function getAllTournamentIds() public view returns (string[] memory) {
        return tournamentIds;
    }
    
    /**
     * @dev Check if a tournament exists
     * @param _tournamentId The tournament ID to check
     * @return True if tournament exists, false otherwise
     */
    function tournamentExistsCheck(string memory _tournamentId) 
        public 
        view 
        returns (bool) 
    {
        return tournamentExists[_tournamentId];
    }
    
    /**
     * @dev Get the total number of tournaments
     * @return The total count of tournaments
     */
    function getTournamentCount() public view returns (uint256) {
        return tournamentIds.length;
    }
    
    /**
     * @dev Get tournament scores for a specific player
     * @param _playerId The player ID to search for
     * @return Array of tournament IDs where the player participated
     */
    function getTournamentsByPlayer(uint256 _playerId) 
        public 
        view 
        returns (string[] memory) 
    {
        string[] memory playerTournaments = new string[](tournamentIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < tournamentIds.length; i++) {
            TournamentScore memory tournament = tournamentScores[tournamentIds[i]];
            if (tournament.playerOneId == _playerId || tournament.playerTwoId == _playerId) {
                playerTournaments[count] = tournamentIds[i];
                count++;
            }
        }
        
        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = playerTournaments[i];
        }
        
        return result;
    }
    
    /**
     * @dev Update contract owner (only current owner can call this)
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    /**
     * @dev Get the contract owner
     * @return The address of the contract owner
     */
    function getOwner() public view returns (address) {
        return owner;
    }
}
