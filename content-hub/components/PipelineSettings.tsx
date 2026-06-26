'use client';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { Pipeline, Stage } from '@/lib/types';

interface Props {
  pipelines: Pipeline[];
  onChange: (pipelines: Pipeline[]) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function PipelineSettings({ pipelines, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(pipelines[0]?.id || null);
  const [addingPipeline, setAddingPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');

  const addPipeline = () => {
    if (!newPipelineName.trim()) return;
    const id = generateId();
    onChange([...pipelines, {
      id, name: newPipelineName.trim(),
      stages: [
        { id: generateId(), name: 'Ideas', color: '#6366f1' },
        { id: generateId(), name: 'In Progress', color: '#f59e0b' },
        { id: generateId(), name: 'Done', color: '#22c55e' },
      ]
    }]);
    setNewPipelineName('');
    setAddingPipeline(false);
    setExpanded(id);
  };

  const removePipeline = (id: string) => onChange(pipelines.filter(p => p.id !== id));

  const addStage = (pipelineId: string) => {
    onChange(pipelines.map(p => p.id === pipelineId
      ? { ...p, stages: [...p.stages, { id: generateId(), name: 'New Stage', color: '#6366f1' }] }
      : p));
  };

  const removeStage = (pipelineId: string, stageId: string) => {
    onChange(pipelines.map(p => p.id === pipelineId
      ? { ...p, stages: p.stages.filter(s => s.id !== stageId) }
      : p));
  };

  const updateStage = (pipelineId: string, stageId: string, field: keyof Stage, value: string) => {
    onChange(pipelines.map(p => p.id === pipelineId
      ? { ...p, stages: p.stages.map(s => s.id === stageId ? { ...s, [field]: value } : s) }
      : p));
  };

  const updatePipelineName = (id: string, name: string) =>
    onChange(pipelines.map(p => p.id === id ? { ...p, name } : p));

  const handleStageDragEnd = (pipelineId: string, result: DropResult) => {
    if (!result.destination) return;
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;
    const stages = Array.from(pipeline.stages);
    const [moved] = stages.splice(result.source.index, 1);
    stages.splice(result.destination.index, 0, moved);
    onChange(pipelines.map(p => p.id === pipelineId ? { ...p, stages } : p));
  };

  const inputStyle: React.CSSProperties = {
    background: '#1a1d26', border: '1px solid #2d3148', borderRadius: 8,
    padding: '7px 11px', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={20} color="#6366f1" /> Pipelines
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Add, rename pipelines and drag to reorder stages.</p>
        </div>
        <button onClick={() => setAddingPipeline(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Add Pipeline
        </button>
      </div>

      {addingPipeline && (
        <div style={{ background: '#13151e', border: '1px solid #6366f1', borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', gap: 8 }}>
          <input autoFocus value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPipeline()}
            style={{ ...inputStyle, flex: 1 }} placeholder="Pipeline name..." />
          <button onClick={() => setAddingPipeline(false)} style={{ background: '#1a1d26', border: '1px solid #2d3148', color: '#94a3b8', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={addPipeline} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Create</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pipelines.map(pipeline => (
          <div key={pipeline.id} style={{ background: '#13151e', border: '1px solid #1e2130', borderRadius: 12, overflow: 'hidden' }}>
            {/* Pipeline header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === pipeline.id ? null : pipeline.id)}>
              {expanded === pipeline.id ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
              <input
                value={pipeline.name}
                onChange={e => updatePipelineName(pipeline.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ ...inputStyle, flex: 1, background: 'none', border: 'none', fontSize: 15, fontWeight: 700, color: '#e2e8f0', padding: 0 }}
              />
              <span style={{ fontSize: 12, color: '#475569' }}>{pipeline.stages.length} stages</span>
              {pipelines.length > 1 && (
                <button onClick={e => { e.stopPropagation(); removePipeline(pipeline.id); }}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Stages with drag to reorder */}
            {expanded === pipeline.id && (
              <div style={{ borderTop: '1px solid #1e2130', padding: 16 }}>
                <DragDropContext onDragEnd={(result) => handleStageDragEnd(pipeline.id, result)}>
                  <Droppable droppableId={`stages-${pipeline.id}`}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pipeline.stages.map((stage, idx) => (
                          <Draggable key={stage.id} draggableId={stage.id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  background: snapshot.isDragging ? '#1e2438' : 'transparent',
                                  borderRadius: 8, padding: snapshot.isDragging ? '4px 8px' : '0',
                                }}
                              >
                                <div {...provided.dragHandleProps} style={{ color: '#334155', cursor: 'grab', flexShrink: 0, display: 'flex' }}>
                                  <GripVertical size={16} />
                                </div>
                                <input type="color" value={stage.color}
                                  onChange={e => updateStage(pipeline.id, stage.id, 'color', e.target.value)}
                                  style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0, borderRadius: '50%', flexShrink: 0 }} />
                                <input value={stage.name}
                                  onChange={e => updateStage(pipeline.id, stage.id, 'name', e.target.value)}
                                  style={{ ...inputStyle, flex: 1 }} placeholder="Stage name..." />
                                <button onClick={() => removeStage(pipeline.id, stage.id)}
                                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6 }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <button onClick={() => addStage(pipeline.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed #2d3148', borderRadius: 8, padding: '8px 14px', color: '#475569', cursor: 'pointer', fontSize: 13, marginTop: 10, width: '100%', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3148'; e.currentTarget.style.color = '#475569'; }}>
                  <Plus size={14} /> Add Stage
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
