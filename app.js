const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDbObject = (eachItem) => {
  return {
    playerId: eachItem.player_id,
    playerName: eachItem.player_name,
  };
};
///API 1

app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `
     SELECT * FROM player_details;`;
  const getPlayersResponse = await db.all(getPlayerDetailsQuery);
  response.send(
    getPlayersResponse.map((eachPlayer) => convertPlayerDbObject(eachPlayer))
  );
});

///API2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIDQuery = `
    SELECT * 
        FROM player_details
    WHERE player_id=${playerId};`;
  const getPlayerByIDResponse = await db.get(getPlayerByIDQuery);
  response.send(convertPlayerDbObject(getPlayerByIDResponse));
});

///API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerNameQuery = `
    UPDATE player_details
        SET player_name='${playerName}'
    WHERE player_id=${playerId}`;
  const updatePlayerNameResponse = await db.run(updatePlayerNameQuery);
  response.send("Player Details Updated");
});

const convertMatchDetailsObject = (eachObject) => {
  return {
    matchId: eachObject.match_id,
    match: eachObject.match,
    year: eachObject.year,
  };
};
///API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
     SELECT * FROM match_details
       WHERE match_id=${matchId};`;
  const getMatchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsObject(getMatchDetails));
});

///API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
     SELECT 
     * 
     FROM 
     player_match_score
     NATURAL JOIN match_details
     WHERE player_id=${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) => convertMatchDetailsObject(eachMatch))
  );
});

///API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
     SELECT * FROM player_match_score
     NATURAL JOIN player_details
     WHERE match_id=${matchId};`;
  const getPlayers = await db.all(getPlayersOfMatchQuery);
  response.send(
    getPlayers.map((eachPlayer) => convertPlayerDbObject(eachPlayer))
  );
});

///API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes 
    FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const getPlayers = await db.get(getPlayerNameQuery);
  response.send(getPlayers);
});
module.exports = app;
