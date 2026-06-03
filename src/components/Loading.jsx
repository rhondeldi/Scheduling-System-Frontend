// ===================== IMPORTS =====================
import "../assets/Loading.css";

// ===================== LOADING COMPONENT =====================
export function Loading({ IsLoading }) {
  return null;
}

// ===================== POPUP COMPONENT =====================
const getPopupType = (heading, headingStyle, explicitType) => {
  if (explicitType) return explicitType;

  const title = String(heading || "").toLowerCase();
  const style = String(headingStyle || "").toLowerCase();

  if (
    style.includes("success") ||
    title.includes("success") ||
    title.includes("successful") ||
    title.includes("saved") ||
    title.includes("deleted")
  ) {
    return "success";
  }

  if (
    style.includes("error") ||
    title.includes("failed") ||
    title.includes("error") ||
    title.includes("invalid")
  ) {
    return "error";
  }

  if (
    style.includes("warning") ||
    title.includes("warning") ||
    title.includes("incomplete") ||
    title.includes("required")
  ) {
    return "warning";
  }

  if (style.includes("notice") || title.includes("notice")) return "notice";
  return "info";
};

const getPopupIcon = (type) => {
  switch (type) {
    case "success":
      return "OK";
    case "error":
    case "warning":
      return "!";
    case "notice":
    default:
      return "i";
  }
};

export function Popup({ popupOptions, closeButtonActionHandler }) {
  if (!popupOptions) return null;

  const { Heading, HeadingStyle, Message, type: popupType } = popupOptions;
  const type = getPopupType(Heading, HeadingStyle?.background, popupType);
  const icon = getPopupIcon(type);

  return (
    <div className="popup-blanket">
      <div
        className={`popup-component popup-${type}`}
        style={{
          width: Array.isArray(Message) ? "min(92vw, 860px)" : "min(92vw, 520px)",
          maxHeight: Array.isArray(Message) ? "min(82vh, 620px)" : "min(74vh, 430px)",
        }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="popup-heading"
      >
        <div className="popup-heading">
          <div className="popup-heading-copy">
            <span className="popup-heading-icon">{icon}</span>
            <h1 id="popup-heading">{Heading}</h1>
          </div>
        </div>

        <div className="popup-message">
          {Array.isArray(Message) ? (
            <ol>
              {Message.map((msg, idx) => (
                <li key={idx}>{String(msg).trim()}</li>
              ))}
            </ol>
          ) : (
            <p>{Message}</p>
          )}
        </div>

        <button className="popup-close-button" onClick={closeButtonActionHandler}>
          Close
        </button>
      </div>
    </div>
  );
}

// ===================== COLOR CONSTANTS =====================
export const POPUP_ERROR_COLOR = "#b42318";
export const POPUP_SUCCESS_COLOR = "#075f3a";
export const POPUP_WARNING_COLOR = "#6f6734";
export const POPUP_NOTICE_COLOR = "#003f2d";
