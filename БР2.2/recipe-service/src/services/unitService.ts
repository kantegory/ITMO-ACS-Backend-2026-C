import { AppDataSource } from '../config/data-source';
import { Unit } from '../models/unit.entity';

const unitRepo = () => AppDataSource.getRepository(Unit);

export async function listUnits() {
  const rows = await unitRepo().find({ order: { id: 'ASC' } });
  return rows.map((u) => ({ id: u.id, name: u.name }));
}
