import React, {useState, useCallback} from "react";
import {Button, Card, Text, Select} from "@gravity-ui/uikit";
import {FileArrowUp} from "@gravity-ui/icons";

const FILE_TYPES: Record<string, {label: string; comment: string; sheetname: string;}> = {
    daily_sheet: {
        label: "\u041b\u0438\u0441\u0442 \u0435\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0433\u043e \u0443\u0447\u0435\u0442\u0430",
        comment: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u0442\u0447\u0435\u0442\u043e\u0432 \u00ab\u041b\u0418\u0421\u0422 \u0415\u0416\u0415\u0414\u041d\u0415\u0412\u041d\u041e\u0413\u041e \u0423\u0427\u0415\u0422\u0410 \u0414\u0412\u0418\u0416\u0415\u041d\u0418\u042f \u041f\u0410\u0426\u0418\u0415\u041d\u0422\u041e\u0412 \u0418 \u041a\u041e\u0415\u0427\u041d\u041e\u0413\u041e \u0424\u041e\u041d\u0414\u0410 \u041c\u0415\u0414\u0418\u0426\u0418\u041d\u0421\u041a\u041e\u0419 \u041e\u0420\u0413\u0410\u041d\u0418\u0417\u0410\u0426\u0418\u0418, \u041e\u041a\u0410\u0417\u042b\u0412\u0410\u042e\u0429\u0415\u0419 \u041c\u0415\u0414\u0418\u0426\u0418\u041d\u0421\u041a\u0423\u042e \u041f\u041e\u041c\u041e\u0429\u042c \u0412 \u0421\u0422\u0410\u0426\u0418\u041e\u041d\u0410\u0420\u041d\u042b\u0425 \u0423\u0421\u041b\u041e\u0412\u0418\u042f\u0425, \u0412 \u0423\u0421\u041b\u041e\u0412\u0418\u042f\u0425 \u0414\u041d\u0415\u0412\u041d\u041e\u0413\u041e \u0421\u0422\u0410\u0426\u0418\u041e\u041d\u0410\u0420\u0410 \u0437\u0430 \u043f\u0435\u0440\u0438\u043e\u0434 \u0441 "',
        sheetname: "Лист_1",
    },
    meds_expense: {
        label: "\u0420\u0430\u0441\u0445\u043e\u0434 \u041b\u0421, \u041c\u0418 \u043f\u043e \u043f\u0440\u043e\u043b\u0435\u0447\u0435\u043d\u043d\u044b\u043c \u0431\u043e\u043b\u044c\u043d\u044b\u043c",
        comment: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u0442\u0447\u0435\u0442\u0430 \u00ab\u0420\u0430\u0441\u0445\u043e\u0434 \u041b\u0421, \u041c\u0418 \u043f\u043e \u043f\u0440\u043e\u043b\u0435\u0447\u0435\u043d\u043d\u044b\u043c \u0431\u043e\u043b\u044c\u043d\u044b\u043c\u00bb',
        sheetname: "Результат",
    },
    reestr: {
        label: "\u0420\u0435\u0435\u0441\u0442\u0440 \u0441\u043b\u0443\u0447\u0430\u0435\u0432",
        comment: "\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439 \u043e\u0442\u0447\u0435\u0442. \u0420\u0435\u0435\u0441\u0442\u0440 \u0441\u043b\u0443\u0447\u0430\u0435\u0432",
        sheetname: "Данные",
    },
};

const FILE_TYPE_OPTIONS = Object.entries(FILE_TYPES).map(([key, v]) => ({
    value: key,
    content: v.label,
}));

export const DataLoaderApp: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [sheetName, setSheetName] = useState("\u0414\u0430\u043d\u043d\u044b\u0435");
    const [fileType, setFileType] = useState("reestr");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        type: "success" | "error";
        message: string;
        log?: string[];
    } | null>(null);

    const currentType = FILE_TYPES[fileType];

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("sheet_name", sheetName);
            formData.append("file_type", fileType);

            const resp = await fetch("/api/internal/v1/data-loader/upload", {
                method: "POST",
                body: formData,
            });

            const data = await resp.json();
            if (resp.ok) {
                const rows = data.rows || 0;
                const inserted = data.inserted || 0;
                const updated = data.updated || 0;
                const skipped = data.skipped || 0;
                setResult({
                    type: "success",
                    message: `\u0424\u0430\u0439\u043b \u00ab${file.name}\u00bb \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u043d: ${rows} \u0441\u0442\u0440\u043e\u043a (\u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043e ${inserted}, \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043e ${updated}, \u043f\u0440\u043e\u043f\u0443\u0449\u0435\u043d\u043e ${skipped}).`,
                    log: data.log || [],
                });
            } else {
                setResult({
                    type: "error",
                    message: data.message || "\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438",
                    log: data.log || [],
                });
            }
        } catch (err) {
            setResult({
                type: "error",
                message: err instanceof Error ? err.message : "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0442\u0438",
            });
        } finally {
            setLoading(false);
        }
    }, [file, sheetName, fileType]);

    return (
        <div style={{padding: "24px", maxWidth: "800px", margin: "0 auto"}}>
            <Text variant="header-1">{"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0434\u0430\u043d\u043d\u044b\u0445"}</Text>
            <Text variant="body-2" color="secondary" style={{display: "block", marginTop: "8px"}}>
                {"\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043b \u0434\u043b\u044f \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u0432 \u0431\u0430\u0437\u0443 \u0434\u0430\u043d\u043d\u044b\u0445"}
            </Text>
            <Card style={{padding: "24px", marginTop: "16px"}}>
                {/* \u0422\u0438\u043f \u0444\u0430\u0439\u043b\u0430 */}
                <div style={{marginBottom: "16px"}}>
                    <Text variant="body-1" style={{display: "block", marginBottom: "8px"}}>
                        {"\u0422\u0438\u043f \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c\u043e\u0433\u043e \u0444\u0430\u0439\u043b\u0430"}
                    </Text>
                    <div style={{width: "100%"}}>
                        <Select
                            value={[fileType]}
                            
                            onUpdate={(val) => {
                                const newType = val[0] || "reestr";
                                setFileType(newType);
                                setSheetName(FILE_TYPES[newType].sheetname);
                            }}
                            
                            options={FILE_TYPE_OPTIONS}
                        />
                    </div>
                    {currentType && (
                        <div style={{
                            marginTop: "8px",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            background: "#eef2ff",
                            border: "1px solid #d6e0ff",
                            fontSize: "13px",
                            color: "#333",
                        }}>
                            {currentType.comment}
                        </div>
                    )}
                </div>

                {/* \u0424\u0430\u0439\u043b */}
                <div style={{marginBottom: "16px"}}>
                    <Text variant="body-1" style={{display: "block", marginBottom: "8px"}}>{"\u0424\u0430\u0439\u043b"}</Text>
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        style={{width: "100%"}}
                    />
                    {file && (
                        <Text variant="caption-1" color="secondary" style={{display: "block", marginTop: "4px"}}>
                            {file.name} ({(file.size / 1024).toFixed(1)} \u041a\u0411)
                        </Text>
                    )}
                </div>

                {/* \u0418\u043c\u044f \u043b\u0438\u0441\u0442\u0430 */}
                <div style={{marginBottom: "16px"}}>
                    <Text variant="body-1" style={{display: "block", marginBottom: "8px"}}>
                        {"\u0418\u043c\u044f \u043b\u0438\u0441\u0442\u0430 Excel"}
                    </Text>
                    <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        placeholder={"\u0414\u0430\u043d\u043d\u044b\u0435"}
                        style={{width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d0d0d0"}}
                    />
                </div>

                <Button view="action" size="l" onClick={handleUpload} disabled={!file || loading} loading={loading}>
                    <FileArrowUp /> {"\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c"}
                </Button>

                {result && (
                    <div style={{
                        marginTop: "16px",
                        padding: "12px",
                        borderRadius: "6px",
                        background: result.type === "success" ? "#edf6ef" : "#fde7e9",
                    }}>
                        <Text variant="body-2" style={{fontWeight: 600}}>
                            {result.type === "success" ? "\u2713 " : "\u2715 "}{result.message}
                        </Text>
                        {result.log && result.log.length > 0 && (
                            <div style={{
                                marginTop: "12px",
                                padding: "12px",
                                background: "#f6f6f6",
                                borderRadius: "6px",
                                maxHeight: "400px",
                                overflowY: "auto",
                                fontFamily: "monospace",
                                fontSize: "13px",
                                lineHeight: "1.6",
                            }}>
                                {result.log.map((line, i) => (
                                    <div key={i} style={{
                                        color: line.includes("\u274c") ? "#d92d20" :
                                               line.includes("\u26a0") ? "#e8a317" :
                                               "#333",
                                    }}>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
