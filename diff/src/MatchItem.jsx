import React from 'react';

function MatchItem({ match }) {
  return (
    <div className="match-item">
      <h3>{match.summonerName}</h3>
      <p>Champion: {match.championName}</p>
      <p>Kills: {match.kills}</p>
      <p>Deaths: {match.deaths}</p>
      <p>Assists: {match.assists}</p>
      <p>Vision Score: {match.visionScore}</p>
    </div>
  );
}

export default MatchItem;