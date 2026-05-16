// ===================== IMPORTS =====================
import { useState } from "react";
import "../assets/ContextMenu.css";

// ===================== POSITION CLASS =====================
export class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// ===================== HOOKS =====================
export function useContextMenuState() {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState(new Position(0, 0));

  return {
    "show": show,
    "setShow": setShow,
    "position": position,
    "setPosition": setPosition,
  };
}

// ===================== CONTEXT MENU COMPONENT =====================
export function ContextMenu({ children, closeAfterClick, conextMenuState }) {
  return (
    <>
      {conextMenuState.show ? (
        <div
          className="context-menu"
          style={{
            top: `${conextMenuState.position.y}px`,
            left: `${conextMenuState.position.x}px`,
          }}
          onClick={() => {
if (closeAfterClick) {
              setTimeout(() => {
                conextMenuState.setShow(false);
              }, 500);
            }
          }}
          onMouseLeave={() => {
            conextMenuState.setShow(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </>
  );
}

// ===================== CONTEXT MENU ITEM COMPONENT =====================
export function ContextMenuItem({ children, onClick }) {
  return (
    <div
      className="context-menu-items no-text-select"
      onClick={onClick}
    >
      {children}
    </div>
  );
}
