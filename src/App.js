import {useEffect, useReducer} from "react";
import {v4 as uuid} from 'uuid';
import {API} from 'aws-amplify';
import {List, Input, Button} from 'antd'
import {listNotes} from './graphql/queries'
import {createNote as CreateNote} from './graphql/mutations'
import 'antd/dist/antd.css';
import './App.css';

const CLIENT_ID = uuid()

function renderItem(item) {
  return (
    <List.Item style={styles.item}>
      <List.Item.Meta
        title={item.name}
        description={item.description}
      />
    </List.Item>
  )
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_NOTES':
      return {...state, notes: action.notes, loading: false}
    case 'ADD_NOTE':
      return {...state, notes: [action.note, ...state.notes]}
    case 'RESET_FORM':
      return { ...state, form: initialState.form }
    case 'SET_INPUT':
      return {...state, form: {...state.form, [action.name]: action.value}}
    case 'ERROR':
      return {...state, loading: false, error: true}
    default:
      return state
  }
}

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: {name: '', description: ''}
}

const styles = {
  container: {padding: 20},
  input: {marginBottom: 10},
  item: {textAlign: 'left'},
  p: {color: '#1890ff'}
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  function onChange(e) {
    dispatch({type: 'SET_INPUT', value: e.target.value, name: e.target.name})
  }

  async function createNote() {
    const {form} = state
    if (!form.name || !form.description) {
      return alert('please enter a name and description')
    }
    const note = {...form, clientId: CLIENT_ID, completed: false, id: uuid()}
    dispatch({type: 'ADD_NOTE', note})
    dispatch({type: 'RESET_FORM'})
    try {
      await API.graphql({
        query: CreateNote,
        variables: {input: note}
      })
      console.log('successfully created note!')
    } catch (err) {
      console.log("error: ", err)
    }
  }

  async function fetchNotes() {
    try {
      const notesData = await API.graphql({query: listNotes})
      dispatch({type: 'SET_NOTES', notes: notesData.data.listNotes.items})
    } catch (e) {
      console.log('error: ', e);
      dispatch({type: 'ERROR'})
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [])

  return (
    <div style={styles.container}>
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Note Name"
        name='name'
        style={styles.input}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Note description"
        name='description'
        style={styles.input}
      />
      <Button
        onClick={createNote}
        type="primary"
      >Create Note</Button>

      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
      {state.notes.map(note => <p key={note.name}>{note.name}</p>)}
    </div>
  );
}

export default App;
