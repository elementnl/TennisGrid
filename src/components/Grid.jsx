import { useRef, useState, useEffect } from "react";
import Cell from "./Cell";
import CategoryLabel from "./CategoryLabel";

export default function Grid({ puzzle, gameState, onCellSelect, shakingCell }) {
  const { rows, cols } = puzzle;
  const { grid, isComplete } = gameState;
  const labelRef = useRef(null);
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    if (labelRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setLabelWidth(entry.contentBoxSize[0]?.inlineSize || entry.contentRect.width);
        }
      });
      observer.observe(labelRef.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <>
      {/* Mobile */}
      <div className="w-full sm:hidden overflow-x-clip">
        <div
          className="grid gap-1.5 -translate-x-2"
          style={{
            gridTemplateColumns: "minmax(80px, 110px) repeat(3, 1fr)",
          }}
        >
          <div />
          {cols.map((col, i) => (
            <CategoryLabel key={`col-${i}`} category={col} valign="end" />
          ))}
          {rows.map((row, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <CategoryLabel category={row} />
              {cols.map((_, colIdx) => (
                <Cell
                  key={`cell-${rowIdx}-${colIdx}`}
                  cellData={grid[rowIdx][colIdx]}
                  onSelect={onCellSelect}
                  disabled={isComplete}
                  rowIdx={rowIdx}
                  colIdx={colIdx}
                  shaking={shakingCell?.row === rowIdx && shakingCell?.col === colIdx}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop — ~50% larger cells */}
      <div className="w-full hidden sm:flex justify-center overflow-visible">
        <div
          className="grid gap-3 mt-5"
          style={{
            gridTemplateColumns: "auto repeat(3, minmax(180px, 280px))",
            transform: labelWidth ? `translateX(-${labelWidth / 3}px)` : undefined,
          }}
        >
          <div ref={labelRef} />
          {cols.map((col, i) => (
            <CategoryLabel key={`col-${i}`} category={col} valign="end" />
          ))}
          {rows.map((row, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <CategoryLabel category={row} />
              {cols.map((_, colIdx) => (
                <Cell
                  key={`cell-${rowIdx}-${colIdx}`}
                  cellData={grid[rowIdx][colIdx]}
                  onSelect={onCellSelect}
                  disabled={isComplete}
                  rowIdx={rowIdx}
                  colIdx={colIdx}
                  shaking={shakingCell?.row === rowIdx && shakingCell?.col === colIdx}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
