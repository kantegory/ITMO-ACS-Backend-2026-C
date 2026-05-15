import axios from 'axios';
import settings from '../config/config';

const client = axios.create({
  headers: {
    Authorization: `Bearer ${settings.SERVICE_TOKEN}`,
  },
});

export async function serviceGet<T>(url: string): Promise<T> {
  const response = await client.get<T>(url);
  return response.data;
}