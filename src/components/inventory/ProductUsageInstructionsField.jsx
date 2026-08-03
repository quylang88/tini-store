import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Eraser,
} from "lucide-react";

const ProductUsageInstructionsField = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  const editorRef = useRef(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const checkActiveStates = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const nextValue = value ?? "";
      if (currentHtml !== nextValue) {
        editorRef.current.innerHTML = nextValue;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || "";
      const finalValue = text.trim() === "" ? "" : html;
      onChange?.(finalValue);
      checkActiveStates();
    }
  };

  const execCommand = (command, val = null) => {
    if (disabled || readOnly || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const clearFormatting = () => {
    if (disabled || readOnly || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat", false, null);
    handleInput();
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-bold text-rose-700 uppercase">
          Hướng dẫn sử dụng
        </label>

        {!readOnly && !disabled && (
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand("bold");
              }}
              className={`p-1.5 rounded transition-colors ${
                activeStates.bold
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="In đậm (Bold)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand("italic");
              }}
              className={`p-1.5 rounded transition-colors ${
                activeStates.italic
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="In nghiêng (Italic)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand("underline");
              }}
              className={`p-1.5 rounded transition-colors ${
                activeStates.underline
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="Gạch chân (Underline)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand("strikeThrough");
              }}
              className={`p-1.5 rounded transition-colors ${
                activeStates.strikeThrough
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="Gạch ngang (Strikethrough)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-gray-300 mx-0.5" />

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand("insertUnorderedList");
              }}
              className={`p-1.5 rounded transition-colors ${
                activeStates.insertUnorderedList
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="Danh sách dấu chấm (Bullet List)"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand("insertOrderedList");
              }}
              className={`p-1.5 rounded transition-colors ${
                activeStates.insertOrderedList
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title="Danh sách số (Numbered List)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-gray-300 mx-0.5" />

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearFormatting();
              }}
              className="p-1.5 rounded text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
              title="Xoá định dạng"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled && !readOnly}
        onInput={handleInput}
        onKeyUp={checkActiveStates}
        onMouseUp={checkActiveStates}
        onSelect={checkActiveStates}
        data-placeholder="Nhập hướng dẫn sử dụng sản phẩm..."
        dangerouslySetInnerHTML={{ __html: value ?? "" }}
        className={`min-h-24 max-h-72 w-full overflow-y-auto rounded-lg border p-3 text-sm text-gray-900 outline-none transition-colors border-gray-200 focus:border-rose-400 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_strike]:line-through ${
          readOnly || disabled ? "bg-gray-50 text-gray-500" : "bg-white"
        }`}
      />
    </div>
  );
};

export default ProductUsageInstructionsField;
