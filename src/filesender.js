import React, { Component } from 'react';
import peerjs from 'peerjs';
import randomstring from 'randomstring';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Slide from '@material-ui/core/Slide';
import Toolbar from '@material-ui/core/Toolbar';

import fileListCreate from './fileListHelper';

import './DwvComponent.css';
import dwv from 'dwv';
import TagsTable from './TagsTable';

dwv.utils.decodeQuery = dwv.utils.base.decodeQuery;
// progress
dwv.gui.displayProgress = function () { };
// get element
dwv.gui.getElement = dwv.gui.base.getElement;
// refresh element
dwv.gui.refreshElement = dwv.gui.base.refreshElement;

// Image decoders (for web workers)
dwv.image.decoderScripts = {
    "jpeg2000": "assets/dwv/decoders/pdfjs/decode-jpeg2000.js",
    "jpeg-lossless": "assets/dwv/decoders/rii-mango/decode-jpegloss.js",
    "jpeg-baseline": "assets/dwv/decoders/pdfjs/decode-jpegbaseline.js"
};

const styles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    appBar: {
        position: 'relative',
    },
    title: {
        flex: '0 0 auto',
    },
    tagsDialog: {
        minHeight: '90vh', maxHeight: '90vh',
        minWidth: '90vw', maxWidth: '90vw',
    },
    iconSmall: {
        fontSize: 20,
    },
});

function TransitionUp(props) {
    return <Slide direction="up" {...props} />;
}

class filesender extends Component {
    constructor(prop) {
        super(prop);
        this.state = {
            peer: new peerjs(),
            my_id: '',
            peer_id: '',
            initialized: false,
            files: [],
            versions: {
                dwv: dwv.getVersion(),
                react: React.version
            },
            tools: ['Scroll', 'ZoomAndPan', 'WindowLevel', 'Draw'],
            selectedTool: 'Select Tool',
            loadProgress: 0,
            dataLoaded: false,
            dwvApp: null,
            tags: [],
            showDicomTags: false,
            toolMenuAnchorEl: null
        }

    }
    componentWillMount() {


        var app = new dwv.App();
        // initialise app
        app.init({
            "containerDivId": "dwv",
            "tools": this.state.tools,
            "shapes": ["Ruler"],
            "isMobile": true
        });

        
        // progress
        var self = this;
        app.addEventListener("load-progress", function (event) {
            self.setState({ loadProgress: event.loaded });
        });
        app.addEventListener("load-end", function (event) {
            // set data loaded flag
            self.setState({ dataLoaded: true });
            // set dicom tags
            self.setState({ tags: app.getTags() });
            // set the selected tool
            if (app.isMonoSliceData() && app.getImage().getNumberOfFrames() === 1) {
                self.setState({ selectedTool: 'ZoomAndPan' });
            } else {
                self.setState({ selectedTool: 'Scroll' });
            }
        });
        this.setState({dwvApp: app});
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
    onChangeTool = tool => {
        if (this.state.dwvApp) {
            this.setState({ selectedTool: tool });
            this.state.dwvApp.onChangeTool({ currentTarget: { value: tool } });
        }
    }

    onReset = tool => {
        if (this.state.dwvApp) {
            this.state.dwvApp.onDisplayReset();
        }
    }

    handleTagsDialogOpen = () => {
        this.setState({ showDicomTags: true });
    };

    handleTagsDialogClose = () => {
        this.setState({ showDicomTags: false });
    };

    handleMenuButtonClick = event => {
        this.setState({ toolMenuAnchorEl: event.currentTarget });
    };

    handleMenuClose = event => {
        this.setState({ toolMenuAnchorEl: null });
    };

    handleMenuItemClick = tool => {
        this.setState({ toolMenuAnchorEl: null });
        this.onChangeTool(tool);
    };
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

            this.state.conn.on('data', this.onReceiveData.bind(this));
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
    viewDicom(event, fileUrl,name) {
        const input = document.querySelector('input[type=file]');
        var self = this;
        console.log(fileUrl);
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
        const { classes } = this.props;
        const { versions, tools, loadProgress, dataLoaded, tags, toolMenuAnchorEl } = this.state;

        const toolsMenuItems = tools.map((tool) =>
            <MenuItem onClick={this.handleMenuItemClick.bind(this, tool)} key={tool} value={tool}>{tool}</MenuItem>
        );
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
                    <div id="dwv">
                        <LinearProgress variant="determinate" value={loadProgress} />
                        <div className="button-row">
                            <Button variant="contained" color="primary"
                                aria-owns={toolMenuAnchorEl ? 'simple-menu' : null}
                                aria-haspopup="true"
                                onClick={this.handleMenuButtonClick}
                                disabled={!dataLoaded}
                                className={classes.button}
                                size="medium"
                            >{this.state.selectedTool}
                                <ArrowDropDownIcon className={classes.iconSmall} /></Button>
                            <Menu
                                id="simple-menu"
                                anchorEl={toolMenuAnchorEl}
                                open={Boolean(toolMenuAnchorEl)}
                                onClose={this.handleMenuClose}
                            >
                                {toolsMenuItems}
                            </Menu>

                            <Button variant="contained" color="primary"
                                disabled={!dataLoaded}
                                onClick={this.onReset}
                            >Reset</Button>

                            <Button variant="contained" color="primary"
                                onClick={this.handleTagsDialogOpen}
                                disabled={!dataLoaded}
                                className={classes.button}
                                size="medium">Tags</Button>
                            <Dialog
                                open={this.state.showDicomTags}
                                onClose={this.handleTagsDialogClose}
                                TransitionComponent={TransitionUp}
                                classes={{ paper: classes.tagsDialog }}
                            >
                                <AppBar className={classes.appBar}>
                                    <Toolbar>
                                        <IconButton color="inherit" onClick={this.handleTagsDialogClose} aria-label="Close">
                                            <CloseIcon />
                                        </IconButton>
                                        <Typography variant="title" color="inherit" className={classes.flex}>DICOM Tags</Typography>
                                    </Toolbar>
                                </AppBar>
                                <TagsTable data={tags} />
                            </Dialog>
                        </div>

                        <div className="layerContainer">
                            <div className="dropBox">Drag and drop data here.</div>
                            <canvas className="imageLayer">Only for HTML5 compatible browsers...</canvas>
                            <div className="drawDiv"></div>
                        </div>
                        <div className="legend"><p>Powered by <a
                            href="https://github.com/ivmartel/dwv"
                            title="dwv on github">dwv
                            </a> {versions.dwv} and React {versions.react}
                        </p></div>
                    </div>
                </div>
            );
        } else {
            result = <div>Loading...</div>;
        }
        return result;
    }
}

filesender.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(filesender);