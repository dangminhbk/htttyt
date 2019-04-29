
/**
 * get initial state
 */
function initialzerState()
{
    return {
        version:"1.0.0",
        dvwApp: null,
        files:[],
        my_Peerid: '',
        my_appID:'',
    }
}

// Action type

const ADD_RECEIVE_FILE = "ADD_RECEIVE_FILE";
const NEW_APP_ID = "NEW_APP_ID";
const NEW_PEER_ID = "NEW_PEER_ID";
const INIT_DWV_APP = "INIT_DWV_APP";
// Action creator


/**
 * 
 * @param {*} state 
 * @param {*} action 
 * @param {*} payload 
 */
export default function (state = initialzerState(), action, payload)
{
    switch(action.type)
    {
        case ADD_RECEIVE_FILE:
        {
            let state = state;
            state.dvwApp = payload.dvwApp;
            return state;
        }
        case NEW_APP_ID:
        {
            return state;
        }
        case NEW_PEER_ID:
        {
            return state;
        }
        case INIT_DWV_APP:
        {
            let state = state;
            state.dvwApp = payload.dvwApp;
            return state;
        }
    }
}