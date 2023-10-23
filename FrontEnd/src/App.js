// src/components/TodoApp.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Use the correct server address


const taskStyle = {
  display: 'flex',
  alignItems: 'center', // Center items vertically
};

const deleteButtonStyle = {
  marginLeft: '10px', // Add space between task text and delete button
};


function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Function to fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/proxy/https://uk5wr941yb.execute-api.us-east-1.amazonaws.com/Stage/hello`);
      console.log('Fetched tasks:', response.data)
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async () => {
    if (newTask.trim() === '') return;
  
    const taskData = {
      data: newTask,
      status: 'false', // Set status to 'true'
    };
  
    try {
      const response = await axios.post(`${API_BASE_URL}/proxy/https://uk5wr941yb.execute-api.us-east-1.amazonaws.com/Stage/hello`, taskData);
      console.log('Added task:', taskData);
      console.log('Added task:', response.data);
      setNewTask('');
      fetchTasks(); // Refresh the task list after adding a new task
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  

  const deleteTask = async (itemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/proxy/https://uk5wr941yb.execute-api.us-east-1.amazonaws.com/Stage/hello/${itemId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const toggleTaskStatus = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'true' ? 'false' : 'true'; // Toggle the status
    try {
      await axios.put(`${API_BASE_URL}/proxy/https://uk5wr941yb.execute-api.us-east-1.amazonaws.com/Stage/hello/${itemId}`, {
        status: newStatus, // Update the status to the new value
      });
      // Update the local task list to reflect the new status
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.itemId === itemId ? { ...task, status: newStatus } : task
        )
      );
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div>
      <h1>Todo List</h1>
      <div>
        <input
          type="text"
          placeholder="Enter a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button onClick={addTask}>Add Task</button>
      </div>
      <ul>
        {tasks.map((task) => (
          <li key={task.itemId} style={taskStyle}>
            <input
              type="checkbox"
              checked={task.status === 'true'}
              onChange={() => toggleTaskStatus(task.itemId, task.status)}
            />
            <span>{task.data}</span>
            <button onClick={() => deleteTask(task.itemId)} style={deleteButtonStyle}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;