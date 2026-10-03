import React, {useState, useEffect} from 'react';
import {Loader, Text, Icon} from '@gravity-ui/uikit';
import {LayoutCellsLarge} from '@gravity-ui/icons';
import block from 'bem-cn-lite';
import {DL} from 'ui/constants/common';

const b = block('dashboards-list');

export const DashboardsList: React.FC = () => {
    const [dashboards, setDashboards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const usersRes = await fetch('/api/internal/v1/all-users', {credentials: 'include'});
                if (!usersRes.ok) throw new Error('Failed to load users');
                const users = await usersRes.json();

                const userLogin = (DL.USER as any)?.login;
                const currentUser = users.find((u: any) => u.login === userLogin);

                if (!currentUser) {
                    setDashboards([]);
                    setLoading(false);
                    return;
                }

                const dashRes = await fetch(
                    `/api/internal/v1/my-dashboards?userId=${currentUser.user_id}`,
                    {credentials: 'include'}
                );
                if (!dashRes.ok) throw new Error('Failed to load dashboards');
                const data = await dashRes.json();
                setDashboards(data);
                setLoading(false);
            } catch (e: any) {
                setError(e.message);
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <Loader size="l" />;

    return (
        <div className={b()} style={{padding: '24px', maxWidth: '900px', margin: '0 auto'}}>
            <Text variant="header-1" style={{marginBottom: '24px'}}>Дашборды</Text>
            {error && <Text color="danger">{error}</Text>}
            {dashboards.length === 0 && !error && (
                <Text variant="body-2" color="secondary">
                    Дашборды не назначены. Обратитесь к администратору.
                </Text>
            )}
            {dashboards.length > 0 && !error && (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr>
                            <th style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--g-color-line-generic)',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--g-color-text-secondary)',
                            }}>
                                Дашборд
                            </th>
                            <th style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--g-color-line-generic)',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--g-color-text-secondary)',
                            }}>
                                Воркбук
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {dashboards.map((d) => (
                            <tr key={d.entry_id}>
                                <td style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--g-color-line-generic)',
                                }}>
                                    <a
                                        href={`/${d.key}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            textDecoration: 'none',
                                            color: 'var(--g-color-text-primary)',
                                        }}
                                    >
                                        <span style={{
                                            color: '#ff9500',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}>
                                            <Icon data={LayoutCellsLarge} size={20} />
                                        </span>
                                        <Text variant="subheader-2">{d.name}</Text>
                                    </a>
                                </td>
                                <td style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--g-color-line-generic)',
                                }}>
                                    {d.workbook_name ? (
                                        <Text variant="body-2" color="secondary">
                                            {d.workbook_name}
                                        </Text>
                                    ) : (
                                        <Text variant="body-2" color="hint">—</Text>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
