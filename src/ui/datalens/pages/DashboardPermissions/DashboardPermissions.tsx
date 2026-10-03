import React, {useState, useEffect, useCallback} from 'react';
import {Loader, Text, Select, Button} from '@gravity-ui/uikit';
import {TrashBin} from '@gravity-ui/icons';

interface User {
    user_id: string;
    name: string;
    login: string;
    roles: string[];
}

interface Dashboard {
    entry_id: string;
    name: string;
}

interface Permission {
    user_id: string;
    entry_id: string;
    access_level: string;
    entry_name: string;
}




interface DashboardPermissionsProps {
    userId?: string;
    userLogin?: string;
}

export const DashboardPermissions: React.FC<DashboardPermissionsProps> = ({
		userId: fixedUserId,
		userLogin,
	}) => {

    const [users, setUsers] = useState<User[]>([]);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string[]>([]);
    const [selectedDashboard, setSelectedDashboard] = useState<string[]>([]);
    const [accessLevel, setAccessLevel] = useState<string[]>(['view']);

    const loadData = useCallback(async () => {
        const [usersRes, dashRes, permRes] = await Promise.all([
            fetch('/api/internal/v1/all-users', {credentials: 'include'}).then((r) => r.json()),
            fetch('/api/internal/v1/all-dashboards', {credentials: 'include'}).then((r) => r.json()),
            fetch('/api/internal/v1/dashboard-permissions', {credentials: 'include'}).then((r) => r.json()),
        ]);
        setUsers(usersRes);
        setDashboards(dashRes);

        // Находим числовой auth ID по логину
        let filterId = fixedUserId;
        if (userLogin && usersRes.length > 0) {
            const matchedUser = usersRes.find((u: User) => u.login === userLogin);
            if (matchedUser) {
                filterId = String(matchedUser.user_id);
            }
        }

        const filtered = filterId
            ? permRes.filter((p: Permission) => String(p.user_id) === filterId)
            : permRes;
        setPermissions(filtered);

        if (filterId) {
            setSelectedUser([filterId]);
        }
        setLoading(false);
    }, [fixedUserId, userLogin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAssign = async () => {
        const userId = selectedUser[0];
        const entryId = selectedDashboard[0];
        const level = accessLevel[0] || 'view';
        if (!userId || !entryId) return;
        await fetch('/api/internal/v1/dashboard-permissions', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
			body: JSON.stringify({
				userId: userId,
				entryId: entryId,
				accessLevel: level,
			}),

        });
        setSelectedDashboard([]);
        loadData();
    };

	const handleRevoke = async (userId: string, entryId: string) => {
		await fetch(
			`/api/internal/v1/dashboard-permissions?userId=${userId}&entryId=${entryId}`,
			{method: 'DELETE', credentials: 'include'}
		);
		loadData();
	};


    if (loading) return <Loader size="l" />;

    return (
        <div style={{marginTop: '24px'}}>
            <Text variant="header-2" style={{marginBottom: '16px'}}>Права на дашборды</Text>

            <div style={{display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'}}>
                {!fixedUserId && (
                    <div style={{minWidth: '250px'}}>
                        <Select
                            placeholder="Пользователь"
                            value={selectedUser}
                            onUpdate={setSelectedUser}
                            options={users.map((u) => ({
                                value: String(u.user_id),
                                content: `${u.name || u.login} (${(u.roles || []).join(', ')})`,
                            }))}
                        />
                    </div>
                )}
                <div style={{minWidth: '250px'}}>
                    <Select
                        placeholder="Дашборд"
                        value={selectedDashboard}
                        onUpdate={setSelectedDashboard}
                        options={dashboards.map((d) => ({
                            value: String(d.entry_id),
                            content: d.name,
                        }))}
                    />
                </div>
                <div style={{minWidth: '150px'}}>
                    <Select
                        value={accessLevel}
                        onUpdate={setAccessLevel}
                        options={[
                            {value: 'view', content: 'Просмотр'},
                            {value: 'edit', content: 'Редактирование'},
                        ]}
                    />
                </div>
                <Button view="action" onClick={handleAssign}>
                    Назначить
                </Button>
            </div>

            <Text variant="subheader-1" style={{marginBottom: '12px'}}>
                Текущие назначения
            </Text>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {permissions.length === 0 && (
                    <Text variant="body-2" color="secondary">
                        Нет назначенных дашбордов
                    </Text>
                )}
                {permissions.map((p) => {
                    const user = users.find((u) => u.user_id === p.user_id);
                    return (
                        <div
                            key={`${p.user_id}-${p.entry_id}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--g-color-line-generic)',
                            }}
                        >
                            <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
                                <Text variant="body-2">{p.entry_name}</Text>
                                {!fixedUserId && (
                                    <Text variant="body-2" color="secondary">
                                        {user ? `${user.name || user.login}` : p.user_id}
                                    </Text>
                                )}
                                <Text variant="body-2" color="secondary">
                                    {p.access_level === 'edit' ? 'Редактирование' : 'Просмотр'}
                                </Text>
                            </div>
                            <Button
                                view="flat"
                                onClick={() => handleRevoke(p.user_id, p.entry_id)}
                            >
                                <TrashBin />
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
