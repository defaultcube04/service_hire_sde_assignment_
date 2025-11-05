import { useEffect, useState } from 'react';

export default function Marketplace() {
  const [others, setOthers] = useState([]);
  const [mySwappables, setMySwappables] = useState([]);
  const [offerFor, setOfferFor] = useState(null);

  const load = async () => {
    const [{ data: theirs }, { data: mine }] = await Promise.all([
      window.api.get('/swappable-slots'),
      window.api.get('/events')
    ]);
    setOthers(theirs);
    setMySwappables(mine.filter((e) => e.status === 'SWAPPABLE'));
  };

  useEffect(() => {
    load();
  }, []);

  const requestSwap = async (theirSlotId, mySlotId) => {
    await window.api.post('/swap-request', { theirSlotId, mySlotId });
    setOfferFor(null);
    await load();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Marketplace</h1>
      <p className="text-muted mb-3">Browse available slots from other users</p>

      {others.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No swappable slots available at the moment.</p>
        </div>
      ) : (
        <ul className="card-list">
          {others.map((ev) => (
            <li key={ev._id} className="card-item">
              <div className="event-title">{ev.title}</div>
              <div className="event-time">
                <strong>👤 By:</strong> {ev.owner?.name || ev.owner?.email}
              </div>
              <div className="event-time">
                📅 {new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleString()}
              </div>
              <div className="event-actions">
                <button 
                  onClick={() => setOfferFor(ev)} 
                  className="btn btn-primary"
                >
                  Request Swap
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {offerFor && (
        <div className="modal-overlay" onClick={() => setOfferFor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Offer Your Slot</h3>
              <button className="modal-close" onClick={() => setOfferFor(null)}>×</button>
            </div>
            <div className="mb-2">
              <p><strong>Requesting swap for:</strong></p>
              <div className="card-item">
                <div className="event-title">{offerFor.title}</div>
                <div className="event-time">
                  📅 {new Date(offerFor.startTime).toLocaleString()} - {new Date(offerFor.endTime).toLocaleString()}
                </div>
              </div>
            </div>
            
            {mySwappables.length === 0 ? (
              <div className="empty-state">
                <p>No swappable slots available. Mark one of your events as SWAPPABLE first in the Dashboard.</p>
              </div>
            ) : (
              <>
                <p className="mb-2"><strong>Select one of your slots to offer:</strong></p>
                <ul className="card-list">
                  {mySwappables.map((mine) => (
                    <li key={mine._id} className="card-item">
                      <div className="event-title">{mine.title}</div>
                      <div className="event-time">
                        📅 {new Date(mine.startTime).toLocaleString()} - {new Date(mine.endTime).toLocaleString()}
                      </div>
                      <div className="event-actions">
                        <button 
                          onClick={() => requestSwap(offerFor._id, mine._id)} 
                          className="btn btn-success"
                        >
                          Offer This Slot
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="event-actions" style={{ marginTop: '20px' }}>
              <button onClick={() => setOfferFor(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


