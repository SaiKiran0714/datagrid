import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

export async function getHealth(){
  const { data } = await api.get('/health');
  return data;
}

export async function getData(params){
  const { data } = await api.get('/data', { params });
  return data;
}

export async function getRecord(id){
  const { data } = await api.get(`/data/${id}`);
  return data;
}

export async function deleteRecord(id){
  const { data } = await api.delete(`/data/${id}`);
  return data;
}

export async function getDistinct(field){
  const { data } = await api.get(`/data/distinct`, { params: { field } });
  return data?.values || [];
}


