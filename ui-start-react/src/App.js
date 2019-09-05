import React, { useState } from 'react';
import { Button, message, Icon, Select } from 'antd';
import styles from './App.less';
const { dialog } = window.require('electron').remote;
const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
// const path = window.require('path');

const { Option } = Select;

function App() {
    const [scripts, setScripts] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [selectedValue, setSelectedValue] = useState(undefined);

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
            console.log(selectedValue);
            ipcRenderer.send('shell', selectedValue);
        }
    };

    const stop = () => {
        console.log(selectedValue);
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
                        <Button type="primary" onClick={start}>
                            启动
                        </Button>
                        <Button onClick={stop}>停止</Button>
                    </div>
                </div>

                {/* 右侧控制台输出 */}
                <div className={styles.terminal}>bbb</div>
            </div>
        </div>
    );
}

export default App;
