import "../assets/Loading.css";

import HighlightOffIcon from '@mui/icons-material/HighlightOff';

export function Loading({
  IsLoading,
}) {
  return IsLoading ? (
    <div className="loading-component">
      <h1>Please wait...</h1>
      <div className="loading-spinner" />
    </div>
  ) : null;
}

/**example popup option state structure:
 * 
 * ```json
 * popupOptions = {
 *  "Heading": "Success",
 *  "HeadingStyle" : {color: "white", background : "green"}
 *  "Message": "action is done"
 * }
 * ```
 */
export function Popup({
  popupOptions,
  closeButtonActionHandler
}) {
  if (!popupOptions) return null;

  const { Heading, HeadingStyle, Message } = popupOptions;

  return (
    <div className="popup-blanket">
      <div
        className="popup-component"
        style={{
            width: Array.isArray(Message) ? 'clamp(200px, 85vh, 900px)' : 'clamp(200px, 65vh, 600px)',
            height: Array.isArray(Message) ? 'clamp(150px, 60vh, 600px)' : 'clamp(150px, 35vh, 400px)',

        }}
      >
        <div className="popup-heading" style={HeadingStyle}>
          <h1>{Heading}</h1>
        </div>
        <div
          className="popup-message"
          style={{
            overflowY: 'auto',
            paddingRight: '0.7em',
          }}
        >
          {Array.isArray(Message) ? (
            <ol style={{ margin: 0, textAlign: 'left' }}>
              {Message.map((msg, idx) => (
                <li key={idx}>{msg.trim()}</li>
              ))}
            </ol>
          ) : (
            <p>{Message}</p>
          )}
        </div>
        <button onClick={closeButtonActionHandler}>X</button>
      </div>
    </div>
  );
}

export const POPUP_ERROR_COLOR   = 'linear-gradient(145deg,rgb(210, 0, 0) 50%,rgba(208, 15, 15, 0.58) 100%)';
export const POPUP_SUCCESS_COLOR = 'linear-gradient(135deg,rgb(21, 157, 21) 50%,rgba(0, 159, 19, 0.73) 100%)';
export const POPUP_WARNING_COLOR = 'linear-gradient(135deg,rgb(255, 166, 0) 0%,rgba(254, 169, 0, 0.56) 100%)';
export const POPUP_NOTICE_COLOR  = 'linear-gradient(135deg,rgb(255, 213, 0) 0%,rgba(255, 225, 0, 0.69) 100%)';
