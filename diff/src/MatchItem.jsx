import React from 'react';
import './MatchItem.css';

function MatchItem({ match }) {
  const team1 = match.participants.slice(0, 5);
  const team2 = match.participants.slice(5, 10);

  return (
    <div className="match-item">
      <div className="team team1">
        <h3>Team 1</h3>
        {team1.map((participant, index) => (
          <div key={index} className="participant">
            <p>Summoner: {participant.summonerName}</p>
            <p>Champion: {participant.championName}</p>
            <p>Kills: {participant.kills}</p>
            <p>Deaths: {participant.deaths}</p>
            <p>Assists: {participant.assists}</p>
            <p>Vision Score: {participant.visionScore}</p>
          </div>
        ))}
      </div>
      <div className="team team2">
        <h3>Team 2</h3>
        {team2.map((participant, index) => (
          <div key={index} className="participant">
            <p>Summoner: {participant.summonerName}</p>
            <p>Champion: {participant.championName}</p>
            <p>Kills: {participant.kills}</p>
            <p>Deaths: {participant.deaths}</p>
            <p>Assists: {participant.assists}</p>
            <p>Vision Score: {participant.visionScore}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchItem;