/**
 * StateMachine - Generic state management
 * Used for player, enemies, and boss AI
 */

export interface State<T> {
    name: string;
    onEnter?: (entity: T) => void;
    onUpdate?: (entity: T, time: number, delta: number) => void;
    onExit?: (entity: T) => void;
}

export class StateMachine<T> {
    private entity: T;
    private states: Map<string, State<T>> = new Map();
    private currentState: State<T> | null = null;
    private previousState: State<T> | null = null;
    
    constructor(entity: T) {
        this.entity = entity;
    }
    
    addState(state: State<T>): StateMachine<T> {
        this.states.set(state.name, state);
        return this;
    }
    
    setState(name: string): void {
        const newState = this.states.get(name);
        
        if (!newState) {
            console.warn(`State "${name}" not found`);
            return;
        }
        
        if (this.currentState === newState) return;
        
        // Exit current state
        if (this.currentState?.onExit) {
            this.currentState.onExit(this.entity);
        }
        
        this.previousState = this.currentState;
        this.currentState = newState;
        
        // Enter new state
        if (this.currentState.onEnter) {
            this.currentState.onEnter(this.entity);
        }
    }
    
    update(time: number, delta: number): void {
        if (this.currentState?.onUpdate) {
            this.currentState.onUpdate(this.entity, time, delta);
        }
    }
    
    getCurrentState(): string | null {
        return this.currentState?.name ?? null;
    }
    
    getPreviousState(): string | null {
        return this.previousState?.name ?? null;
    }
    
    isInState(name: string): boolean {
        return this.currentState?.name === name;
    }
}
