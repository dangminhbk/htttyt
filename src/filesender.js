import React, { Component } from 'react';
import peerjs from 'peerjs';
import randomstring from 'randomstring';
class filesender extends Component {
    constructor(prop) {
        super(prop);
        this.state = {
            peer: new peerjs(),
            my_id: '',
            peer_id: '',
            initialized: false,
            files: [],
        }
    }
    componentWillMount() {
        this.state.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            this.setState({
                my_id: id,
                initialized: true
            });
        });

        this.state.peer.on('connection', (connection) => {
            console.log('someone connected');
            console.log(connection);
            this.setState({
                conn: connection
            }, () => {

                this.state.conn.on('open', () => {
                    this.setState({
                        connected: true
                    });
                });
                this.state.conn.on('data', this.onReceiveData.bind(this));
            });
        });    
    }
    componentWillUnmount() {
        this.state.peer.destroy();
    }
    connect() {
        var peer_id = this.state.peer_id;

        var connection = this.state.peer.connect(peer_id);

        this.setState({
            conn: connection
        }, () => {
            this.state.conn.on('open', () => {
                this.setState({
                    connected: true
                });
            });

            this.state.conn.on('data', this.onReceiveData);
        });
    }
    sendfile(event) {
        console.log(event.target.files);
        var file = event.target.files[0];
        var blob = new Blob(event.target.files, { type: file.type });

        this.state.conn.send({
            file: blob,
            filename: file.name,
            filetype: file.type
        });
    }
    addfile = (file) => {
        var file_name = file.name;
        var file_url = file.url;
        var files = this.state.files;
        var file_id = randomstring.generate(5);
        files.push({
            id: file_id,
            url: file_url,
            name: file_name
        });
        this.setState({
            files: files
        });
    }
    onReceiveData(data) {
        var blob = new Blob([data.file], { type: data.filetype });
        var url = URL.createObjectURL(blob);
        console.log(this);
        this.addfile({
            'name': data.filename,
            'url': url
        });
    }
    viewDicom(event, fileUrl,name) 
    {
        var self = this;
        fetch(fileUrl)
        .then(dat=>{
            return dat.blob()
        })
        .then(dat=>{
            console.log(dat);
            var file = new File([dat], name,{type: "Application/dicom"});
            self.state.dwvApp.loadFiles([file]);
        })
        .catch(err=>{
            console.log(err);
        })
        ;
    }
    handleTextChange(event) {
        this.setState({
            peer_id: event.target.value
        });

    }
    renderNotConnected() {
        return (
            <div>
                <hr />
                <div className="mui-textfield">
                    <input type="text" className="mui-textfield" onChange={e => this.handleTextChange(e)} />
                    <label>Mã kết nối</label>
                </div>
                <button className="mui-btn mui-btn--accent" onClick={e => this.connect()}>
                    Kết nối
                </button>
            </div>
        );
    }
    renderListFiles() {
        return (
            <div id="file_list">
                <table className="mui-table mui-table--bordered">
                    <thead>
                        <tr>
                            <th> Danh sách file </th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.files.map(this.renderFile, this)}
                    </tbody>
                </table>
            </div>
        );
    }
    renderConnected() {
        return (
            <div>
                <hr />
                <div>
                    <input type="file" name="file" id="file" className="mui--hide" onChange={e => this.sendfile(e)} />
                    <label htmlFor="file" className="mui-btn mui-btn--small mui-btn--primary mui-btn--fab">+</label>
                </div>
                <div>
                    <hr />
                    {this.state.files.length ? this.renderListFiles() : this.renderNoFiles()}
                </div>
            </div>
        );
    }
    renderFile(file) {
        return (
            <tr key={file.id}>
                <td>
                    <a href={file.url} download={file.name}>{file.name}</a>
                </td>
                <td>
                    <button className="mui-btn mui-btn--accent" onClick={e => this.viewDicom(e, file.url,file.name)}> Xem </button>
                </td>
            </tr>
        );
    }
    renderNoFiles() {
        return (
            <span id="no_files_message">
                {'No files shared to you yet'}
            </span>
        );
    }
    render() {
        var result;
        if (this.state.initialized) {
            result = (
                <div>
                    <div>
                        <div>
                            <span>Mã của bạn </span>
                            <strong className="mui--divider-left">{this.state.my_id}</strong>
                        </div>
                        {this.state.connected ? this.renderConnected() : this.renderNotConnected()}
                    </div>
                </div>
            );
        } else 
        {
            result = <div>Loading...</div>;
        }
        return result;
    }
}

export default filesender;