'use client';
import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Check, GripVertical, X, Settings2, Type, ToggleLeft, Calendar, List } from 'lucide-react';
import { Pipeline, CustomTableColumn, CustomTableRow } from '@/lib/types';

interface Props {
  pipeline: Pipeline;
  rows: CustomTableRow[];
  onRowsChange: (rows: CustomTableRow[]) => void;
  onPipelineChange: (pipeline: Pipeline) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

const COL_TYPES: { type: CustomTableColumn['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text', icon: <Type size={13} /> },
  { type: 'select', label: 'Select', icon: <List size={13} /> },
  { type: 'date', label: 'Date', icon: <Calendar size={13} /> },
  { type: 'checkbox', label: 'Checkbox', icon: <ToggleLeft size={13} /> },
];

const DEFAULT_COL_WIDTH = 200;
const NAME_COL_WIDTH = 240;

const selectColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#64748b',
];

function colorForOption(idx: number) {
  return selectColors[idx % selectColors.length];
}

export default function CustomTable({ pipeline, rows, onRowsChange, onPipelineChange }: Props) {
  const tableRows = rows.filter(r => r.tableId === pipeline.id);
  const columns: CustomTableColumn[] = pipeline.columns || [];

  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<CustomTableColumn['type']>('text');
  const [openSelect, setOpenSelect] = useState<{ rowId: string; colId: string } | null>(null);
  const [editingOptions, setEditingOptions] = useState<string | null>(null); // colId
  const [newOptionText, setNewOptionText] = useState('');
  const [showColMenu, setShowColMenu] = useState<string | null>(null); // colId
  const [editingColName, setEditingColName] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const addColInputRef = useRef<HTMLInputElement>(null);
  const cellRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (showAddCol && addColInputRef.current) addColInputRef.current.focus();
  }, [showAddCol]);

  // --- Column ops ---
  const updateColumns = (cols: CustomTableColumn[]) => {
    onPipelineChange({ ...pipeline, columns: cols });
  };

  const addColumn = () => {
    if (!newColName.trim()) return;
    const col: CustomTableColumn = {
      id: generateId(),
      name: newColName.trim(),
      type: newColType,
      width: DEFAULT_COL_WIDTH,
      options: newColType === 'select' ? [] : undefined,
    };
    updateColumns([...columns, col]);
    setNewColName('');
    setNewColType('text');
    setShowAddCol(false);
  };

  const deleteColumn = (colId: string) => {
    updateColumns(columns.filter(c => c.id !== colId));
    // Also clear values for this col in all rows
    const updatedRows = rows.map(r =>
      r.tableId === pipeline.id
        ? { ...r, values: Object.fromEntries(Object.entries(r.values).filter(([k]) => k !== colId)) }
        : r
    );
    onRowsChange(updatedRows);
    setShowColMenu(null);
  };

  const renameColumn = (colId: string, name: string) => {
    updateColumns(columns.map(c => c.id === colId ? { ...c, name } : c));
  };

  const addOptionToColumn = (colId: string, option: string) => {
    if (!option.trim()) return;
    updateColumns(columns.map(c =>
      c.id === colId ? { ...c, options: [...(c.options || []), option.trim()] } : c
    ));
  };

  const removeOptionFromColumn = (colId: string, optIdx: number) => {
    updateColumns(columns.map(c =>
      c.id === colId ? { ...c, options: (c.options || []).filter((_, i) => i !== optIdx) } : c
    ));
  };

  // --- Row ops ---
  const addRow = () => {
    const row: CustomTableRow = {
      id: generateId(),
      tableId: pipeline.id,
      values: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onRowsChange([...rows, row]);
  };

  const deleteRow = (rowId: string) => {
    onRowsChange(rows.filter(r => r.id !== rowId));
  };

  const setCellValue = (rowId: string, colId: string, value: string | boolean) => {
    onRowsChange(rows.map(r =>
      r.id === rowId
        ? { ...r, values: { ...r.values, [colId]: value }, updatedAt: new Date().toISOString() }
        : r
    ));
  };

  const setRowName = (rowId: string, name: string) => {
    onRowsChange(rows.map(r =>
      r.id === rowId ? { ...r, values: { ...r.values, __name: name }, updatedAt: new Date().toISOString() } : r
    ));
  };

  // --- Render helpers ---
  const cellKey = (rowId: string, colId: string) => `${rowId}:${colId}`;

  const renderCell = (row: CustomTableRow, col: CustomTableColumn) => {
    const val = row.values[col.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
    const key = cellKey(row.id, col.id);

    if (col.type === 'checkbox') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <input
            type="checkbox"
            checked={!!val}
            onChange={e => setCellValue(row.id, col.id, e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </div>
      );
    }

    if (col.type === 'date') {
      return (
        <input
          type="date"
          value={(val as string) || ''}
          onChange={e => setCellValue(row.id, col.id, e.target.value)}
          style={{
            background: 'none', border: 'none', color: val ? '#94a3b8' : '#334155',
            fontSize: 13, outline: 'none', width: '100%', cursor: 'pointer',
            fontFamily: 'inherit', padding: '0 4px',
          }}
        />
      );
    }

    if (col.type === 'select') {
      const selectedVal = (val as string) || '';
      const opts = col.options || [];
      const selectedIdx = opts.indexOf(selectedVal);
      const isOpen = openSelect?.rowId === row.id && openSelect?.colId === col.id;

      return (
        <div style={{ position: 'relative', width: '100%' }}>
          <button
            onClick={() => setOpenSelect(isOpen ? null : { rowId: row.id, colId: col.id })}
            style={{
              width: '100%', background: 'none', border: 'none', textAlign: 'left',
              cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {selectedVal ? (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                background: `${colorForOption(selectedIdx)}22`,
                color: colorForOption(selectedIdx), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{selectedVal}</span>
            ) : (
              <span style={{ fontSize: 12, color: '#334155' }}>—</span>
            )}
          </button>
          {isOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 1000,
              background: '#13151e', border: '1px solid #2d3148', borderRadius: 10,
              padding: 6, minWidth: 160, boxShadow: '0 8px 24px #0008',
            }}>
              {opts.length === 0 && (
                <div style={{ fontSize: 12, color: '#475569', padding: '6px 8px' }}>
                  No options yet — add in column settings
                </div>
              )}
              {selectedVal && (
                <button onClick={() => { setCellValue(row.id, col.id, ''); setOpenSelect(null); }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: '5px 8px', borderRadius: 6 }}>
                  Clear
                </button>
              )}
              {opts.map((opt, i) => (
                <button key={i} onClick={() => { setCellValue(row.id, col.id, opt); setOpenSelect(null); }}
                  style={{
                    width: '100%', textAlign: 'left', background: opt === selectedVal ? '#6366f111' : 'none',
                    border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 6,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorForOption(i), flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>{opt}</span>
                  {opt === selectedVal && <Check size={11} color="#6366f1" style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // text (default)
    return (
      <textarea
        ref={el => { cellRefs.current[key] = el; }}
        value={(val as string) || ''}
        onChange={e => setCellValue(row.id, col.id, e.target.value)}
        onFocus={() => setEditingCell({ rowId: row.id, colId: col.id })}
        onBlur={() => setEditingCell(null)}
        style={{
          background: 'none', border: 'none', outline: 'none', color: '#cbd5e1',
          fontSize: 13, fontFamily: 'inherit', resize: 'none', width: '100%',
          lineHeight: 1.5, padding: '0 4px', minHeight: 22, overflow: 'hidden',
        }}
        rows={1}
        onInput={e => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = el.scrollHeight + 'px';
        }}
        placeholder="—"
      />
    );
  };

  const colTypeIcon = (type: CustomTableColumn['type']) => {
    return COL_TYPES.find(t => t.type === type)?.icon || <Type size={13} />;
  };

  // Column header with rename + settings
  const renderColHeader = (col: CustomTableColumn) => {
    const isMenuOpen = showColMenu === col.id;
    const isEditOpts = editingOptions === col.id;

    return (
      <div key={col.id} style={{
        width: col.width || DEFAULT_COL_WIDTH, minWidth: col.width || DEFAULT_COL_WIDTH,
        flexShrink: 0, borderRight: '1px solid #1e2130', position: 'relative',
      }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: '100%',
            cursor: 'pointer', userSelect: 'none',
          }}
          onClick={() => {
            setShowColMenu(isMenuOpen ? null : col.id);
            setEditingColName(col.name);
          }}
        >
          <span style={{ color: '#475569', flexShrink: 0 }}>{colTypeIcon(col.type)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {col.name}
          </span>
          <ChevronDown size={11} color="#334155" />
        </div>

        {/* Column dropdown menu */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 1000,
            background: '#13151e', border: '1px solid #2d3148', borderRadius: 10,
            padding: 10, minWidth: 220, boxShadow: '0 8px 24px #0008',
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Rename */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Rename</div>
              <input
                value={editingColName}
                onChange={e => setEditingColName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { renameColumn(col.id, editingColName); setShowColMenu(null); }
                  if (e.key === 'Escape') setShowColMenu(null);
                }}
                style={{ background: '#0d0f14', border: '1px solid #2d3148', borderRadius: 6, padding: '5px 8px', color: '#e2e8f0', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                autoFocus
              />
              <button onClick={() => { renameColumn(col.id, editingColName); setShowColMenu(null); }}
                style={{ marginTop: 4, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                Save
              </button>
            </div>

            {/* Select options management */}
            {col.type === 'select' && (
              <div style={{ marginBottom: 8, borderTop: '1px solid #1e2130', paddingTop: 8 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Options</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
                  {(col.options || []).map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorForOption(i), flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{opt}</span>
                      <button onClick={() => removeOptionFromColumn(col.id, i)}
                        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2 }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={newOptionText}
                    onChange={e => setNewOptionText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        addOptionToColumn(col.id, newOptionText);
                        setNewOptionText('');
                      }
                    }}
                    placeholder="Add option..."
                    style={{ background: '#0d0f14', border: '1px solid #2d3148', borderRadius: 6, padding: '4px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none', flex: 1, fontFamily: 'inherit' }}
                  />
                  <button onClick={() => { addOptionToColumn(col.id, newOptionText); setNewOptionText(''); }}
                    style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            )}

            {/* Delete column */}
            <button onClick={() => deleteColumn(col.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '6px 4px', borderTop: '1px solid #1e2130', marginTop: 4 }}>
              <Trash2 size={12} /> Delete column
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onClick={() => { setOpenSelect(null); setShowColMenu(null); }}>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ minWidth: 'max-content' }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'stretch', height: 38,
            background: '#0a0c11', borderBottom: '2px solid #1e2130', position: 'sticky', top: 0, zIndex: 10,
          }}>
            {/* Row number + name col header */}
            <div style={{ width: 32, flexShrink: 0, borderRight: '1px solid #1e2130' }} />
            <div style={{
              width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, flexShrink: 0,
              borderRight: '1px solid #1e2130', display: 'flex', alignItems: 'center', padding: '0 12px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Name
              </span>
            </div>

            {/* Column headers */}
            {columns.map(col => renderColHeader(col))}

            {/* Add column button */}
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
              {showAddCol ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <input
                    ref={addColInputRef}
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') setShowAddCol(false); }}
                    placeholder="Column name..."
                    style={{ background: '#13151e', border: '1px solid #6366f1', borderRadius: 6, padding: '4px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none', width: 140, fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: 2 }}>
                    {COL_TYPES.map(ct => (
                      <button key={ct.type} onClick={() => setNewColType(ct.type)}
                        title={ct.label}
                        style={{ background: newColType === ct.type ? '#6366f1' : '#1a1d26', border: `1px solid ${newColType === ct.type ? '#6366f1' : '#2d3148'}`, borderRadius: 5, padding: '3px 6px', cursor: 'pointer', color: newColType === ct.type ? '#fff' : '#64748b' }}>
                        {ct.icon}
                      </button>
                    ))}
                  </div>
                  <button onClick={addColumn} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
                  <button onClick={() => setShowAddCol(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4 }}><X size={13} /></button>
                </div>
              ) : (
                <button onClick={e => { e.stopPropagation(); setShowAddCol(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px dashed #2d3148', borderRadius: 6, padding: '4px 10px', color: '#475569', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                  <Plus size={12} /> Add column
                </button>
              )}
            </div>
          </div>

          {/* Data rows */}
          {tableRows.map((row, rowIdx) => (
            <div
              key={row.id}
              style={{
                display: 'flex', alignItems: 'stretch', minHeight: 38,
                borderBottom: '1px solid #1a1c26',
                background: hoveredRow === row.id ? '#0d0f1a' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Row number + delete */}
              <div style={{ width: 32, flexShrink: 0, borderRight: '1px solid #1e2130', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hoveredRow === row.id ? (
                  <button onClick={() => deleteRow(row.id)}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={11} />
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: '#2d3148' }}>{rowIdx + 1}</span>
                )}
              </div>

              {/* Name cell */}
              <div style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, flexShrink: 0, borderRight: '1px solid #1e2130', display: 'flex', alignItems: 'center', padding: '6px 12px' }}>
                <textarea
                  value={(row.values.__name as string) || ''}
                  onChange={e => setRowName(row.id, e.target.value)}
                  style={{
                    background: 'none', border: 'none', outline: 'none', color: '#e2e8f0',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit', resize: 'none',
                    width: '100%', lineHeight: 1.5, padding: 0, minHeight: 22, overflow: 'hidden',
                  }}
                  rows={1}
                  onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
                  placeholder="Untitled..."
                />
              </div>

              {/* Data cells */}
              {columns.map(col => (
                <div
                  key={col.id}
                  style={{
                    width: col.width || DEFAULT_COL_WIDTH, minWidth: col.width || DEFAULT_COL_WIDTH,
                    flexShrink: 0, borderRight: '1px solid #1e2130',
                    display: 'flex', alignItems: col.type === 'text' ? 'flex-start' : 'center',
                    padding: col.type === 'text' ? '6px 8px' : '0 8px',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {renderCell(row, col)}
                </div>
              ))}
            </div>
          ))}

          {/* Add row */}
          <button onClick={addRow}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
              background: 'none', border: 'none', color: '#334155', cursor: 'pointer',
              fontSize: 13, padding: '10px 16px', borderBottom: '1px solid #1a1c26',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            <Plus size={14} /> New row
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ borderTop: '1px solid #1e2130', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#334155' }}>{tableRows.length} rows</span>
        <span style={{ fontSize: 12, color: '#334155' }}>{columns.length} columns</span>
      </div>
    </div>
  );
}
