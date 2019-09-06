import React, { useState, useEffect } from 'react';
import { Button, message, Icon, Select } from 'antd';
import styles from './App.less';
const { dialog } = window.require('electron').remote;
const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');

const { Option } = Select;

function App() {
    const [scripts, setScripts] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [selectedValue, setSelectedValue] = useState(undefined);
    const [startStatus, setStartStatus] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const addLog = log => {
            logs.push(log);
            setLogs([...logs]);
        };

        ipcRenderer.on('log', (e, log) => {
            addLog(log);
        });
        ipcRenderer.on('error', error => {
            addLog(error);
            setStartStatus(false);
        });
        ipcRenderer.on('close', () => {
            addLog('stop');
            setStartStatus(false);
        });
    }, []);

    useEffect(() => {
        const logContainer = document.querySelector('#log-container');
        logContainer.scrollTop = logContainer.scrollHeight - logContainer.clientHeight;
    }, [logs]);

    const openDialog = () => {
        dialog
            .showOpenDialog({ properties: ['openFile', 'openDirectory'] })
            .then(result => {
                if (result.canceled) {
                    return;
                }
                // 获取上传文件/文件夹的路径
                let filePath = result.filePaths[0];
                // 判断当前文件是否是package.json文件，或者当前文件夹下是否有package.json文件
                const pathArr = filePath.split('/');
                const fileDirname = pathArr[pathArr.length - 1];
                if (fileDirname !== 'package.json') {
                    filePath = filePath + '/package.json';
                }
                setSelectedFile(filePath);

                // 读取文件
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.log(err);
                        setSelectedFile('');
                        message.error('请选择package.json文件或其所在文件夹');
                        return;
                    }

                    // 获取json文件内容
                    const fileContent = JSON.parse(data);
                    setScripts(Object.keys(fileContent.scripts));
                    setSelectedValue(undefined);
                });
            })
            .catch(err => {
                console.log(err);
            });
    };

    const start = () => {
        if (selectedValue) {
            ipcRenderer.send('shell', selectedValue, selectedFile);
            setStartStatus(true);
        }
    };

    const stop = () => {
        ipcRenderer.send('stop', selectedValue);
    };

    const renderOptions = () => {
        return scripts.map(script => <Option key={script}>{script}</Option>);
    };

    return (
        <div className={styles.appContainer}>
            {/* 选择文件 */}
            <div className={styles.upload} onClick={openDialog}>
                <Icon type="inbox" className={styles.iconInbox} />
                <div className={selectedFile ? styles.greyText : null}>
                    请选择package.json文件或其所在文件夹
                </div>
                {selectedFile && <div>当前文件：{selectedFile}</div>}
            </div>

            <div className={styles.main}>
                {/* 左侧脚本选择 */}
                <div className={styles.sideBar}>
                    <Select
                        placeholder="请选择script"
                        style={{ width: '100%' }}
                        allowclear
                        value={selectedValue}
                        onChange={key => setSelectedValue(key)}
                    >
                        {renderOptions()}
                    </Select>

                    <div className={styles.btnGroup}>
                        <Button
                            type="primary"
                            onClick={start}
                            disabled={!selectedValue || startStatus}
                        >
                            启动
                        </Button>
                        <Button onClick={stop} disabled={!startStatus}>
                            停止
                        </Button>
                    </div>
                </div>

                {/* 右侧控制台输出 */}
                <div className={styles.terminal}>
                    <div id="log-container" className={styles.logContainer}>
                        {logs.map((log, index) => (
                            <div key={index}>
                                {log}
                                <br />
                                <br />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
