import React, {useCallback, useEffect, useState} from 'react';
import {
    Button,
    Dialog,
    Select,
    TextInput,
    Text,
    Icon,
    Loader,
} from '@gravity-ui/uikit';
import {TrashBin, Pencil, Plus, ArrowLeft} from '@gravity-ui/icons';
import block from 'bem-cn-lite';

import './HandDataPage.scss';

const b = block('dl-hand-data-page');

const API_BASE = 'http://localhost:3060/api/v1';
const toApiName = (n: string) => {
    const s = n.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return s.startsWith('hand_') ? s : 'hand_' + s;
};

const fromApiName = (n: string) => n.startsWith("hand_") ? n.slice(5) : n;

const FIELD_TYPES = [
    {value: 'text', content: 'TEXT'},
    {value: 'integer', content: 'INTEGER'},
    {value: 'real', content: 'REAL'},
    {value: 'boolean', content: 'BOOLEAN'},
    {value: 'date', content: 'DATE'},
    {value: 'timestamp', content: 'TIMESTAMP'},
];

type FieldType = 'text' | 'integer' | 'real' | 'boolean' | 'date' | 'timestamp';

type ColumnInfo = {
    name: string;
    type: string;
    nullable: boolean;
};

type TableRow = {
    id: number;
    [key: string]: any;
};

type NewFieldDef = {
    name: string;
    type: FieldType;
    nullable: boolean;
};

/* ── helpers ────────────────────────────────────────── */

async function api<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {'Content-Type': 'application/json'},
        ...options,
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
}

/* ── create-table dialog ────────────────────────────── */

function CreateTableDialog({
    open,
    onClose,
    onCreated,
    connectionId,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    connectionId: string;
}) {
    const [tableName, setTableName] = useState('');
    const [fields, setFields] = useState<NewFieldDef[]>([
        {name: '', type: 'text', nullable: true},
    ]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const reset = () => {
        setTableName('');
        setFields([{name: '', type: 'text', nullable: true}]);
        setError('');
    };

    const handleAddField = () => {
        setFields([...fields, {name: '', type: 'text', nullable: true}]);
    };

    const handleRemoveField = (idx: number) => {
        setFields(fields.filter((_, i) => i !== idx));
    };

    const handleFieldChange = (idx: number, key: keyof NewFieldDef, value: any) => {
        const next = [...fields];
        next[idx] = {...next[idx], [key]: value};
        setFields(next);
    };

    const handleSubmit = async () => {
        if (!tableName.trim()) {
            setError('Укажите имя таблицы');
            return;
        }
        const name = toApiName(tableName.trim().toLowerCase());
        
        const validFields = fields.filter((f) => f.name.trim());
        if (validFields.length === 0) {
            setError('Добавьте хотя бы одно поле');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await api('/hand-tables', {
                method: 'POST',
                body: JSON.stringify({
                    tableName: name,
                    connectionId: connectionId || undefined,
                    fields: validFields.map((f) => ({
                        name: f.name.trim(),
                        type: f.type,
                        nullable: f.nullable,
                    })),
                }),
            });
            reset();
            onCreated();
            onClose();
        } catch (e: any) {
            setError(e.message || 'Ошибка создания таблицы');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} size="m">
            <Dialog.Header caption="Создание таблицы" />
            <Dialog.Body>
                <div className={b('modal-body')}>
                    <div className={b('form-row')}>
                        <label className={b('form-label')}>Имя таблицы</label>
                        <TextInput
                            value={tableName}
                            onUpdate={setTableName}
                            placeholder="my_table"
                        />
                    </div>
                    <div className={b('form-row')}>
                        <label className={b('form-label')}>Поля</label>
                        <div className={b('field-builder')}>
                            {fields.map((f, idx) => (
                                <div key={idx} className={b('field-builder-row')}>
                                    <TextInput
                                        value={f.name}
                                        onUpdate={(v) => handleFieldChange(idx, 'name', v)}
                                        placeholder="имя_поля"
                                        style={{flex: 1}}
                                    />
                                    <Select
                                        value={[f.type]}
                                        onUpdate={(v) => handleFieldChange(idx, 'type', v[0] as FieldType)}
                                        options={FIELD_TYPES}
                                        width={140}
                                    />
                                    <label style={{display: 'flex', alignItems: 'center', gap: 4}}>
                                        <input
                                            type="checkbox"
                                            checked={f.nullable}
                                            onChange={(e) => handleFieldChange(idx, 'nullable', e.target.checked)}
                                        />
                                        NULL
                                    </label>
                                    {fields.length > 1 && (
                                        <Button
                                            view="flat"
                                            onClick={() => handleRemoveField(idx)}
                                        >
                                            <Icon data={TrashBin} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button view="flat" onClick={handleAddField}>
                                <Icon data={Plus} /> Добавить поле
                            </Button>
                        </div>
                    </div>
                    {error && <Text color="danger">{error}</Text>}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
                textButtonApply={busy ? 'Создание...' : 'Создать'}
                propsButtonApply={{loading: busy}}
            />
        </Dialog>
    );
}

/* ── add-field dialog ───────────────────────────────── */

function AddFieldDialog({
    open,
    onClose,
    tableName,
    connectionId,
    onAdded,
}: {
    open: boolean;
    onClose: () => void;
    tableName: string;
    connectionId: string;
    onAdded: () => void;
}) {
    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState<FieldType>('text');
    const [nullable, setNullable] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const reset = () => {
        setFieldName('');
        setFieldType('text');
        setNullable(true);
        setError('');
    };

    const handleSubmit = async () => {
        if (!fieldName.trim()) {
            setError('Укажите имя поля');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await api(`/hand-tables/${toApiName(tableName)}/fields`, {
                method: 'POST',
                body: JSON.stringify({
                    name: fieldName.trim(),
                    type: fieldType,
                    nullable,
                    connectionId: connectionId || undefined,
                }),
            });
            reset();
            onAdded();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} size="s">
            <Dialog.Header caption="Добавить поле" />
            <Dialog.Body>
                <div className={b('modal-body')}>
                    <div className={b('form-row')}>
                        <label className={b('form-label')}>Имя поля</label>
                        <TextInput value={fieldName} onUpdate={setFieldName} placeholder="column_name" />
                    </div>
                    <div className={b('form-row')}>
                        <label className={b('form-label')}>Тип</label>
                        <Select
                            value={[fieldType]}
                            onUpdate={(v) => setFieldType(v[0] as FieldType)}
                            options={FIELD_TYPES}
                        />
                    </div>
                    <div className={b('form-row')}>
                        <label style={{display: 'flex', alignItems: 'center', gap: 6}}>
                            <input
                                type="checkbox"
                                checked={nullable}
                                onChange={(e) => setNullable(e.target.checked)}
                            />
                            Разрешить NULL
                        </label>
                    </div>
                    {error && <Text color="danger">{error}</Text>}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
                textButtonApply={busy ? 'Добавление...' : 'Добавить'}
                propsButtonApply={{loading: busy}}
            />
        </Dialog>
    );
}

/* ── add/edit-row dialog ────────────────────────────── */

function RowDialog({
    open,
    onClose,
    columns,
    tableName,
    connectionId,
    initialData,
    onDone,
}: {
    open: boolean;
    onClose: () => void;
    columns: ColumnInfo[];
    tableName: string;
    connectionId: string;
    initialData: TableRow | null;
    onDone: () => void;
}) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (initialData) {
            const v: Record<string, string> = {};
            columns.forEach((c) => {
                if (c.name !== 'id' && initialData[c.name] !== null) {
                    v[c.name] = String(initialData[c.name] ?? '');
                }
            });
            setValues(v);
        } else {
            setValues({});
        }
        setError('');
    }, [initialData, columns, open]);

    const editableColumns = columns.filter((c) => c.name !== 'id');

    const handleChange = (col: string, val: string) => {
        setValues({...values, [col]: val});
    };

    const handleSubmit = async () => {
        setBusy(true);
        setError('');
        try {
            const body: Record<string, any> = {};
            editableColumns.forEach((c) => {
                if (values[c.name] === '' || values[c.name] === undefined) {
                    if (c.nullable) {
                        body[c.name] = null;
                    }
                } else {
                    body[c.name] = values[c.name];
                }
            });

            const qs = connectionId ? `?connectionId=${connectionId}` : '';
            if (initialData) {
                await api(`/hand-tables/${toApiName(tableName)}/data/${initialData.id}${qs}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                });
            } else {
                await api(`/hand-tables/${toApiName(tableName)}/data${qs}`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
            }
            onDone();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} size="m">
            <Dialog.Header caption={initialData ? 'Редактирование строки' : 'Добавление строки'} />
            <Dialog.Body>
                <div className={b('modal-body')}>
                    {editableColumns.map((c) => (
                        <div key={c.name} className={b('form-row')}>
                            <label className={b('form-label')}>
                                {c.name} <span className={b('field-type')}>({c.type})</span>
                            </label>
                            {c.type === 'boolean' ? (
                                <Select
                                    value={[values[c.name] ?? '']}
                                    onUpdate={(v) => handleChange(c.name, v[0])}
                                    options={[
                                        {value: 'true', content: 'true'},
                                        {value: 'false', content: 'false'},
                                        {value: '', content: c.nullable ? 'NULL' : ''},
                                    ]}
                                />
                            ) : (
                                <TextInput
                                    value={values[c.name] ?? ''}
                                    onUpdate={(v) => handleChange(c.name, v)}
                                    placeholder={
                                        c.type === 'date' ? 'дд.ММ.ГГГГ' :
                                        c.type === 'timestamp' ? 'дд.ММ.ГГГГ ЧЧ:ММ' :
                                        c.nullable ? 'NULL если пусто' : 'обязательное'
                                    }
                                />
                            )}
                        </div>
                    ))}
                    {error && <Text color="danger">{error}</Text>}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={handleSubmit}
                onClickButtonCancel={onClose}
                textButtonApply={busy ? 'Сохранение...' : 'Сохранить'}
                propsButtonApply={{loading: busy}}
            />
        </Dialog>
    );
}

/* ── main component ─────────────────────────────────── */

export default function HandDataPage() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [columns, setColumns] = useState<ColumnInfo[]>([]);
    const [rows, setRows] = useState<TableRow[]>([]);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connections, setConnections] = useState<{entry_id: string; name: string}[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<string>('');

    const [createOpen, setCreateOpen] = useState(false);
    const [addFieldOpen, setAddFieldOpen] = useState(false);
    const [rowDialogOpen, setRowDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<TableRow | null>(null);

    /* connections */
    const fetchConnections = useCallback(async () => {
        try {
            const data = await api<{connections: {entry_id: string; name: string}[]}>('/connections');
            setConnections(data.connections || []);
        } catch (e: any) {
            // молча игнорируем
        }
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    /* tables list */
    const fetchTables = useCallback(async () => {
        if (!selectedConnection) return;
        try {
            const data = await api<{tables: {table_name: string}[]}>(`/hand-tables?connectionId=${selectedConnection}`);
            setTables(data.tables.map((t: any) => fromApiName(t.table_name)));
        } catch (e: any) {
            setError(e.message);
        }
    }, [selectedConnection]);

    /* table schema + data */
    const fetchTableData = useCallback(async (name: string, p: number) => {
        if (!selectedConnection) return;
        setLoading(true);
        setError('');
        try {
            const qs = `connectionId=${selectedConnection}`;
            const [schema, data] = await Promise.all([
                api<{columns: {column_name: string; data_type: string; is_nullable: string}[]}>(`/hand-tables/${toApiName(name)}/schema?${qs}`),
                api<{data: TableRow[]; total: number}>(
                    `/hand-tables/${toApiName(name)}/data?page=${p + 1}&perPage=${pageSize}&${qs}`,
                ),
            ]);
            setColumns((schema.columns || []).map((c: any) => ({
                name: c.column_name,
                type: c.data_type,
                nullable: c.is_nullable === 'YES',
            })));
            setRows(data.data || []);
            setTotal(data.total || 0);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [selectedConnection]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    useEffect(() => {
        if (selectedTable && selectedConnection) {
            fetchTableData(selectedTable, page);
        }
    }, [selectedTable, page, fetchTableData, selectedConnection]);

    /* handlers */
    const handleSelectTable = (name: string) => {
        setSelectedTable(name);
        setPage(0);
    };

    const handleBack = () => {
        setSelectedTable(null);
        setColumns([]);
        setRows([]);
        fetchTables();
    };

    const handleDeleteTable = async (name: string) => {
        if (!confirm(`Удалить таблицу "${name}"? Все данные будут потеряны.`)) {
            return;
        }
        try {
            await api(`/hand-tables/${toApiName(name)}?connectionId=${selectedConnection}`, {method: 'DELETE'});
            if (selectedTable === name) {
                handleBack();
            } else {
                fetchTables();
            }
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDeleteField = async (fieldName: string) => {
        if (!selectedTable) return;
        if (!confirm(`Удалить поле "${fieldName}"? Все данные в этом поле будут потеряны.`)) {
            return;
        }
        try {
            await api(`/hand-tables/${toApiName(selectedTable)}/fields/${fieldName}?connectionId=${selectedConnection}`, {
                method: 'DELETE',
            });
            fetchTableData(selectedTable, page);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDeleteRow = async (rowId: number) => {
        if (!selectedTable) return;
        if (!confirm('Удалить строку?')) return;
        try {
            await api(`/hand-tables/${toApiName(selectedTable)}/data/${rowId}?connectionId=${selectedConnection}`, {
                method: 'DELETE',
            });
            fetchTableData(selectedTable, page);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleEditRow = (row: TableRow) => {
        setEditingRow(row);
        setRowDialogOpen(true);
    };

    const handleAddRow = () => {
        setEditingRow(null);
        setRowDialogOpen(true);
    };

    const onRowDone = () => {
        if (selectedTable) {
            fetchTableData(selectedTable, page);
        }
    };

    const handleSelectConnection = (val: string) => {
        setSelectedConnection(val);
        setSelectedTable(null);
        setColumns([]);
        setRows([]);
        setTables([]);
    };

    const totalPages = Math.ceil(total / pageSize);

    /* render */
    if (!selectedTable) {
        return (
            <div className={b()}>
                <div className={b('header')}>
                    <h2 className={b('title')}>Внесение ручных данных</h2>
                </div>

                <div className={b('section')}>
                    <div className={b('form-row')}>
                        <label className={b('form-label')}>Подключение</label>
                        {connections.length > 0 ? (
                            <Select
                                value={selectedConnection ? [selectedConnection] : []}
                                onUpdate={(v) => handleSelectConnection(v[0] || '')}
                                options={connections.map((c) => ({value: c.entry_id, content: c.name}))}
                                placeholder="Выберите подключение"
                                width="max"
                            />
                        ) : (
                            <Text color="warning">
                                Подключения не найдены. Создайте PostgreSQL-подключение в DataLens.
                            </Text>
                        )}
                    </div>
                </div>

                {selectedConnection && (
                    <div className={b('header')} style={{marginTop: 16}}>
                        <Button view="action" onClick={() => setCreateOpen(true)}>
                            <Icon data={Plus} /> Создать таблицу
                        </Button>
                    </div>
                )}

                {error && <Text color="danger">{error}</Text>}

                {selectedConnection && (
                    <div className={b('section')}>
                        <div className={b('section-title')}>Таблицы ({tables.length})</div>
                        {tables.length === 0 ? (
                            <div className={b('empty-state')}>
                                Нет таблиц. Создайте первую таблицу
                            </div>
                        ) : (
                            <div className={b('table-list')}>
                                {tables.map((t) => (
                                    <div
                                        key={t}
                                        className={b('table-item')}
                                        onClick={() => handleSelectTable(t)}
                                    >
                                        <span className={b('table-name')}>{t}</span>
                                        <div className={b('table-actions')}>
                                            <Button
                                                view="flat"
                                                size="s"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTable(t);
                                                }}
                                            >
                                                <Icon data={TrashBin} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <CreateTableDialog
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onCreated={fetchTables}
                    connectionId={selectedConnection}
                />
            </div>
        );
    }

    return (
        <div className={b()}>
            <div className={b('back-btn')}>
                <Button view="flat" onClick={handleBack}>
                    <Icon data={ArrowLeft} /> Назад к списку
                </Button>
            </div>

            <div className={b('header')}>
                <h2 className={b('title')}>{selectedTable}</h2>
                <Button view="action" onClick={handleAddRow}>
                    <Icon data={Plus} /> Добавить строку
                </Button>
            </div>

            {error && <Text color="danger">{error}</Text>}

            {/* Fields */}
            <div className={b('section')}>
                <div className={b('section-title')}>
                    Поля
                    <Button
                        view="flat"
                        size="s"
                        style={{marginLeft: 8}}
                        onClick={() => setAddFieldOpen(true)}
                    >
                        <Icon data={Plus} /> Добавить поле
                    </Button>
                </div>
                <div className={b('fields')}>
                    {columns.map((c) => (
                        <div key={c.name} className={b('field-chip')}>
                            <span>{c.name}</span>
                            <span className={b('field-type')}>{c.type}</span>
                            {c.nullable && <span className={b('field-type')}>NULL</span>}
                            {c.name !== 'id' && (
                                <div className={b('field-actions')}>
                                    <Button
                                        view="flat"
                                        size="s"
                                        onClick={() => handleDeleteField(c.name)}
                                    >
                                        <Icon data={TrashBin} size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Data */}
            <div className={b('section')}>
                <div className={b('section-title')}>Данные ({total})</div>
                {loading ? (
                    <div className={b('loading')}>
                        <Loader />
                    </div>
                ) : rows.length === 0 ? (
                    <div className={b('empty-state')}>Нет данных. Добавьте первую строку.</div>
                ) : (
                    <>
                        <table className={b('data-table')}>
                            <thead>
                                <tr>
                                    {columns.map((c) => (
                                        <th key={c.name}>{c.name}</th>
                                    ))}
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri}>
                                        {columns.map((c) => (
                                            <td key={c.name}>
                                                {row[c.name] === null ? (
                                                    <span style={{color: '#999'}}>NULL</span>
                                                ) : (
                                                    String(row[c.name] ?? '')
                                                )}
                                            </td>
                                        ))}
                                        <td className={b('row-actions')}>
                                            <Button
                                                view="flat"
                                                size="s"
                                                onClick={() => handleEditRow(row)}
                                            >
                                                <Icon data={Pencil} size={14} />
                                            </Button>
                                            <Button
                                                view="flat"
                                                size="s"
                                                onClick={() => handleDeleteRow(row.id)}
                                            >
                                                <Icon data={TrashBin} size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className={b('pagination')}>
                                <Button
                                    view="flat"
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Назад
                                </Button>
                                <Text>
                                    Страница {page + 1} из {totalPages}
                                </Text>
                                <Button
                                    view="flat"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Вперёд
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AddFieldDialog
                open={addFieldOpen}
                onClose={() => setAddFieldOpen(false)}
                tableName={selectedTable}
                connectionId={selectedConnection}
                onAdded={() => fetchTableData(selectedTable, page)}
            />

            <RowDialog
                open={rowDialogOpen}
                onClose={() => setRowDialogOpen(false)}
                columns={columns}
                tableName={selectedTable}
                connectionId={selectedConnection}
                initialData={editingRow}
                onDone={onRowDone}
            />
        </div>
    );
}
