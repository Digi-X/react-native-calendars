import { Event, PackedEvent } from './EventBlock';
interface PopulateOptions {
    screenWidth?: number;
    dayStart?: number;
    hourBlockHeight?: number;
    overlapEventsSpacing?: number;
    rightEdgeSpacing?: number;
}
export declare const HOUR_BLOCK_HEIGHT = 100;
declare function populateEvents(_events: Event[], populateOptions: PopulateOptions): PackedEvent[];
export default populateEvents;
