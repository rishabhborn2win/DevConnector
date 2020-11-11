import axios from 'axios';
import { setAlert } from './alert';
import { GET_POSTS, POST_ERROR, UPDATE_LIKES, DELETE_POST, ADD_POST }  from './types';

//Get posts
 export const getPosts = () => async dispatch => {
     try {
         const res = await axios.get('/api/post');

         dispatch({
             type: GET_POSTS,
             payload: res.data
         });
     } catch (err) {
        dispatch({
            type: POST_ERROR,
            payload: { msg: err.response.statusText, status: err.response.status },
          });
     }
 }

 //Add Post
 export const addPost = (formData) => async dispatch => {
    const config = {
        Headers: {
            'Content-Type': 'appliction/json'
        }
    }

    try {
        const res = await axios.post('/api/post', formData, config);

        dispatch({
            type: ADD_POST,
            payload: res.data
        });
        dispatch(setAlert('Post Created', 'success'))

    } catch (err) {
       dispatch({
           type: POST_ERROR,
           payload: { msg: err.response.statusText, status: err.response.status },
         });
    }
}


 //Add like 
 export const addLike = id => async dispatch => {
    try {
        const res = await axios.put(`/api/post/like/${id}`);

        dispatch({
            type: UPDATE_LIKES,
            payload: { id , like: res.data}
        });
    } catch (err) {
       dispatch({
           type: POST_ERROR,
           payload: { msg: err.response.statusText, status: err.response.status },
         });
    }
}

//Remove like 
export const removeLike = id => async dispatch => {
    try {
        const res = await axios.put(`/api/post/unlike/${id}`);

        dispatch({
            type: UPDATE_LIKES,
            payload: { id , like: res.data}
        });
    } catch (err) {
       dispatch({
           type: POST_ERROR,
           payload: { msg: err.response.statusText, status: err.response.status },
         });
    }
}

//Delete post
export const deletePost = id => async dispatch => {
    try {
        const res = await axios.delete(`/api/post/${id}`);

        dispatch({
            type: DELETE_POST,
            url: `/api/post/${id}`,
            payload: { id , like: res.data}
        });

        dispatch(setAlert('Post Removed', 'danger'))
    } catch (err) {
       dispatch({
           type: POST_ERROR,
           payload: { msg: err.response.statusText, status: err.response.status },
         });
    }
}