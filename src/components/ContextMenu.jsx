import { useState } from "react";
import "../assets/ContextMenu.css";

export class Position {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

export function useContextMenuState() {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState(new Position(0, 0))

  return {
    "show": show,
    "setShow": setShow,

    "position": position,
    "setPosition": setPosition,
  }
}

export function ContextMenu({ children, closeAfterClick, conextMenuState }) {
  return (
    <> {conextMenuState.show ?
      <div
        className="context-menu"
        
        style={{
          top: `${conextMenuState.position.y}px`,
          left: `${conextMenuState.position.x}px`,
        }}
        
        onClick={() => {
          console.log('after clicked')
          if (closeAfterClick) {
            setTimeout(() => {
              conextMenuState.setShow(false)
            }, 500)
          }
        }}

        onMouseLeave={() => {
          conextMenuState.setShow(false)
        }}
      >
        {children}
      </div > : null
    } </>
  );
}

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