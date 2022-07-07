export interface Option {
    label: string | number | boolean;
    value: string | number | boolean;
    isChecked?: boolean;
    other?: any;
}

export interface FieldNavButton {
    index: number;
    name: string;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    state?: {
        color?: {
            default?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<boolean> | boolean;
            onValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<boolean> | boolean;
        }
        disabled?: {
            default?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<boolean> | boolean;
            onValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<boolean> | boolean;
        },
        visible?: {
            default?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<boolean> | boolean;
            onValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<boolean> | boolean;
        }
    };
    cssClass?: string;
    size?: 'large' | 'small';
    clickHandler: {
        doAction?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => void;
        addValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Option | Option[]> | Option | Option[];
        updateListOptions?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Option | Option[]> | Option | Option[];
    };
    slot?: 'start' | 'end';
}

export interface FieldDataButtonProps {
    name: string;
    index: number;
    color?: 'danger' | 'success' | 'warning' | 'primary';
    disabled?: boolean;
    visible?: boolean;
    size?: 'large' | 'small';
    slot?: 'start' | 'end';
    cssClass?: string;
    btnRef: FieldNavButton;
}

export interface FieldDataInterface {
    index: number;
    init?: boolean;
    helpText: string;
    isRequired?: boolean;
    errors?: string[];
    isAvailable?: boolean;
    computedValue?: any;
    listOptions?: Option[]; 
    formValue: Option[] | Option | null;
    defaultValue?: Option | Option[] | null;
    isDirty?: boolean;
    intLastTimeLoaded?: number;
    navButtonProps: FieldDataButtonProps[];
}

/**
 * if (f.district.isDirty && f.district.inLastTimeLoaded > current.inLastTimeLoaded) {
 *  return []
 * } else {
 * }
 */
export interface FieldInterface {
    /** 
     * Uniquely identifies a field
     */
    id: string | number;
    /**
     * Label text for a field
    */
    helpText: string; 
    /**
     * A field to render on the form
     */
    type: string;
    /**
     * proxyID allows multiple form fields to write to the same
     * value block 
     */
    proxyID?: string | number;
    /**
     * When form value changes, helpText is updated
    */
    updateHelpTextOnValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => string;
    /**
     * Initiates a value whenever the field loads
     */
    dynamicHelpText?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => string;
    /**
     * Validation which prevents from proceeding without entering a value
     */
    isRequired?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => boolean;
    /**
     * Use this to convert Raw form data to other values
     */
    computedValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => any;
    /**
     * Preset value for fields that support  strings, numbers or booleans
     */
    defaultValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Option | Option[];
    /**
     * Set default output of the field that is present when it fails to pass
     * a condition
     */
    defaultOutput?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Option | Option[];
    /**
     * Set default computed value output of the field that only appears when
     * the field fails to pass a condition
    */
    defaultComputedOutput?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Option | Option[];
    /**
     * Hook is called when the field is false. This is helpful for cleanup jobs
     */
    onConditionFalse?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Boolean;
    /** When true, the onfinish is triggered when next button is clicked without going to the other fields */
    exitsForm?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Boolean;
    /**
     * Determine whether to show the field or not
     */
    condition?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Boolean> | Boolean;
    /**
     * Check validity of values before saving
     */
    validation?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<String[] | null> | String[] | null;
    /**
     * Validation before transitioning to the next field
     */
    beforeNext?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Boolean> | Boolean;
    /**
     * Check value before writing it to the form. 
     */
    onValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Boolean> | Boolean;
    /**
     * Update list data when value changes
     */
    onValueUpdate?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Option[]> | Option[];
    /**
     * Runs when a field is mounted
    */
    onload?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => void;
    /**
     * Runs when a field is unmounted
     */
    unload?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => void;
    /**
     * Format summary data
     */
    summaryMapValue?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Option> | Option;
    /**
     * Decide whether to show in summary field or not
     */
    appearInSummary?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Boolean;
    /**
     * Drop down selection options or data for a field
     */
    options?: (value: FieldDataInterface, fields: Record<string, FieldDataInterface>) => Promise<Option[]> | Array<Option>;
    requireNext?: boolean;
    config?: Record<string, any>;
    navButtons?: {
        hide?: Array<"Clear" | "Cancel" | 'Next' | 'Back' | 'Finish'>;
        custom?: FieldNavButton[];
    }
}
