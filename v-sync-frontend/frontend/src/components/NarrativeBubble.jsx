import React from 'react';
import './NarrativeBubble.css';

function NarrativeBubble({ content }) {
  if (!content) {
    return (
      <div className="narrative-bubble narrative-bubble--empty">
        No response received.
      </div>
    );
  }

  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="narrative-bubble">
      {paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

export default NarrativeBubble;
