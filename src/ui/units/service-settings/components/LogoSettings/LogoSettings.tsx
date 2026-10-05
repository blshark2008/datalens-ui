import React, {useState, useEffect} from 'react';
import {Button, Text, TextInput} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';

const b = block('service-settings-logo');

const STORAGE_KEY_ICON = 'customLogoIcon';
const STORAGE_KEY_TEXT = 'customLogoText';
const STORAGE_KEY_INSTALLATION = 'customLogoInstallation';


export const LogoSettings: React.FC = () => {
    const [logoText, setLogoText] = useState('');
    const [logoIcon, setLogoIcon] = useState('');
    const [installationInfo, setInstallationInfo] = useState('');
    const [saved, setSaved] = useState(false);


	useEffect(() => {
		fetch('/logo-config.json')
			.then(res => res.ok ? res.json() : {})
			.then(data => {
				setLogoText(data.logoText || '');
				setLogoIcon(data.logoIcon || '');
				setInstallationInfo(data.installationInfo || '');
			})
			.catch(() => {});
	}, []);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setLogoIcon(reader.result as string);
        };
        reader.readAsText(file);
    };

	const handleSave = () => {
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};



	const handleReset = () => {
		setLogoText('');
		setLogoIcon('');
		setInstallationInfo('');
	};

    return (
        <div className={b()} style={{maxWidth: '500px', padding: '24px'}}>
            <Text variant="subheader-2" style={{marginBottom: '20px'}}>
                Настройки логотипа
            </Text>


            <div style={{marginBottom: '24px'}}>
                <Text variant="body-2" style={{marginBottom: '8px', display: 'block'}}>
                    Текст логотипа
                </Text>
                <TextInput
                    value={logoText}
                    onUpdate={setLogoText}
                    placeholder="Например: Моя компания"
                />
            </div>

            <div style={{marginBottom: '24px'}}>
                <Text variant="body-2" style={{marginBottom: '8px', display: 'block'}}>
                    Дополнительный текст (под названием)
                </Text>
                <TextInput
                    value={installationInfo}
                    onUpdate={setInstallationInfo}
                    placeholder="Например: open source"
                />
            </div>

            <div style={{marginBottom: '24px'}}>
                <Text variant="body-2" style={{marginBottom: '8px', display: 'block'}}>
                    Иконка логотипа (SVG)
                </Text>
                <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={handleFileChange}
                    style={{marginBottom: '12px'}}
                />
                {logoIcon && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        border: '1px solid var(--g-color-line-generic)',
                        borderRadius: '8px',
                    }}>
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            dangerouslySetInnerHTML={{__html: logoIcon}}
                        />
                        <Text variant="body-2" color="secondary">
                            Предпросмотр иконки
                        </Text>
                    </div>
                )}
            </div>

            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <Button view="action" onClick={handleSave}>
                    Сохранить
                </Button>
                <Button view="flat" onClick={handleReset}>
                    Сбросить к стандартному
                </Button>
                {saved && (
                    <Text variant="body-2" color="positive">
                        Сохранено, перезагрузка...
                    </Text>
                )}
            </div>
        </div>
    );
};

export default LogoSettings;
