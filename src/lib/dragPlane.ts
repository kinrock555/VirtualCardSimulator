import { Plane, Vector3 } from 'three';
import { TABLE_SURFACE_Y } from './tableConstants';

/** Shared world-space plane at table height, used to project the pointer ray onto the table. */
export const tableDragPlane = new Plane(new Vector3(0, 1, 0), -TABLE_SURFACE_Y);
