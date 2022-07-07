import { reactive } from 'vue'
import { 
    Option,
    FieldInterface, 
    FieldDataInterface,
    FieldNavButton,
    FieldDataButtonProps,
} from '@/router/FieldInterfaces'
import { isEmpty, isEqual } from "lodash"

let activeField = reactive({} as FieldInterface)
const fieldData = reactive({} as Record<string, FieldDataInterface>)

/**
 * Run callback hooks defined for a field. Each hook is given field parameters
 * @param field 
 * @param hook 
 * @returns 
 */
async function executeHook(
    field: any,
    hook:
    'updateHelpTextOnValue' |
    'dynamicHelpText' |
    'onConditionFalse' |
    'isRequired' |
    'computedValue' |
    'defaultValue' |
    'defaultOutput' |
    'defaultComputedOutput' |
    'exitsForm' |
    'validation' |
    'options' |
    'onload' |
    'unload' |
    'onValue' |
    'appearInSummary' |
    'condition' |
    'beforeNext' |
    'onValueUpdate'
    ) {
    if (hook in field && typeof field[hook] === 'function') {
        return field[hook](
            {...fieldData[field.id]}, 
            {...fieldData}
        )
    }
}

function getFieldDataAttr(
    field: FieldInterface, 
    attr: 
    'index' | 
    'computedValue' |
    'helpText' |
    'init' |
    'isRequired' |
    'isAvailable' |
    'listOptions' |
    'errors' |
    'intLastTimeLoaded' |
    'formValue' |
    'navButtonProps' |
    'isDirty',
    useProxy=true) {
    let val = null
    if (useProxy && field.proxyID) { 
        val = fieldData[field.proxyID][attr]
    } else {
        val = fieldData[field.id][attr]
    }
    return val
}

/**
 * Changes buttons states based on specified event. 
 * This can be either to disable, change color or show/hide based on
 * whether the value changed or if it's  a default state
 * @param field 
 * @param event 
 */
function updateButtonStates(field: FieldInterface, event: 'default' | 'onValue') {
    const buttons = getFieldDataAttr(field, 'navButtonProps', false)
    buttons.forEach((btn: FieldDataButtonProps) => {
        if ('state' in btn?.btnRef) {
            const states: Record<string, any> = btn.btnRef?.state || {}
            for (const p in states) {
                const state = states[p]
                const data = fieldData[field.id]
                btn[p as 'color' | 'disabled' | 'visible'] = state[event](
                    {...data},
                    {...fieldData}
                )
            }
        }
    })
}

/**
 * Write to a field's data object
 * @param data 
 * @param attr 
 */
function setFieldDataAttr(
    field: FieldInterface,
    data: any,
    attr: 
    'computedValue' |
    'helpText' |
    'init' |
    'isRequired' |
    'isAvailable' |
    'listOptions' |
    'errors' |
    'formValue' |
    'intLastTimeLoaded' |
    'isDirty',
    canUpdateParentProxy = true
    ) {
    if (attr in field) {
        if (field.proxyID && canUpdateParentProxy) {
            fieldData[field.proxyID] = data
        }
        fieldData[field.id] = data

    } else {
        console.warn('Cannot set field data with no mounted field')
    }
}

function updateActiveFieldListOptions(options: Option[]) {
    setFieldDataAttr(activeField, options, 'listOptions')
}

function buildAndSetFieldData(
    fields: FieldInterface[], 
    footerButtons: FieldNavButton[]) {
    // Clear out any existing data
    Object.keys(fieldData).forEach((key) => {
        delete fieldData[key]
    })
    // initialise a fields data object. This will track all state for that
    // field
    fields.forEach((field, index) => {
        const initialData: FieldDataInterface = {
            index,
            init: false,
            helpText: '',
            isRequired: false,
            errors: [],
            isAvailable: true,
            computedValue: null,
            listOptions: [], 
            formValue: null,
            defaultValue: null,
            navButtonProps: []
        }
        let defaultBtns = [...footerButtons] 
        const allButtons: Record<string, FieldNavButton> = {}
        const customBtns = field?.navButtons?.custom || []

        // Hide default buttons if specified to do so
        if (!isEmpty(field.navButtons?.hide)) {
            defaultBtns = defaultBtns.filter((btn) => {
                return !(field.navButtons?.hide || []).includes(btn.name as any)
            })
        }
        // Map unique button indexes
        if (!isEmpty(customBtns)) {
            [...defaultBtns, ...customBtns].forEach((btn) => {
                allButtons[btn.index] = btn
            })
        } else {
            defaultBtns.forEach((btn) => allButtons[btn.index] = btn)
        }
        // create button props
        Object.values(allButtons)
            .sort((a, b) => a.index - b.index)
            .forEach((b) => {
                initialData.navButtonProps.push({
                    name: b.name,
                    index: b.index,
                    color: 'primary',
                    disabled: false,
                    visible: true,
                    slot: b.slot || 'start',
                    size: b.size || 'large',
                    cssClass: b.cssClass || '',
                    btnRef: b
                })
            })

        if (field.proxyID) {
            fieldData[field.proxyID] = initialData
        }
        fieldData[field.id] = initialData
   })
}

/**
 * Runs a series of hooks related to writing form values
 * @param val 
 * @returns 
 */
async function setValue(val: Option | Option[]) {
    const field = { ...activeField }

    if (isEmpty(field)) {
        return console.warn('No field is active to set value to')
    }

    setFieldDataAttr(field, null, 'errors')

    const valueOk = await executeHook(field, 'onValue')

    if (valueOk != undefined && !valueOk) return

    setFieldDataAttr(field, isEqual(val, getFieldDataAttr(field, 'formValue')), 'isDirty')

    setFieldDataAttr(field, val || null, 'formValue')

    // Buttons should react when new value is added
    updateButtonStates(field, 'onValue')

    const listUpdate = await executeHook(field, 'onValueUpdate')

    if (listUpdate) setFieldDataAttr(field, listUpdate, 'listOptions', false)

    const helpText = await executeHook(field, 'updateHelpTextOnValue')
    setFieldDataAttr(field, helpText || field.helpText, 'helpText')
}

/**
 * Handles transitional operations to ensure data validity and 
 * handles value computations
 * @returns 
 */
async function computeFieldData() {
    const field = {...activeField}
    const val = getFieldDataAttr(field, 'formValue')
    const required = await executeHook(field, 'isRequired')
    setFieldDataAttr(field, required || false, 'isRequired', false)

    if (required && isEmpty(val)) {
        setFieldDataAttr(field, ["Field can't be empty"], 'errors', false)
        return false
    }

    const errors = await executeHook(field, 'validation')
    if (!isEmpty(errors)) {
        setFieldDataAttr(field, errors, 'errors')
        return false
    }

    const computedValue = await executeHook(field, 'computedValue')
    setFieldDataAttr(field, computedValue || null, 'computedValue')
    return true
}

function clearFieldData() {
    const field = {...activeField}
    if (!isEmpty(field)) {
        setFieldDataAttr(field, null, 'errors')
        setFieldDataAttr(field, null, 'formValue')
        setFieldDataAttr(field, null, 'computedValue')
    }
}

/**
 * Manage conditional states
 * @param field 
 * @returns 
 */
async function onFieldCondition(field: FieldInterface) {
    try {
        const isAvailable = await executeHook(field, 'condition')
        if (isAvailable === undefined || isAvailable) {
            setFieldDataAttr(field, true, 'isAvailable')
            return true
        }
        await executeHook(field, 'onConditionFalse')
        const defaultValue = await executeHook(field, 'defaultOutput')
        const defaultComputedOutput = await executeHook(field, 'defaultComputedOutput')
        setFieldDataAttr(field, defaultValue || null, 'formValue')
        setFieldDataAttr(field, defaultComputedOutput || null, 'computedValue')
        setFieldDataAttr(field, false, 'isAvailable')
        return false
    } catch (e) {
        return false
    }
}

/**
 * Manage states when changing fields on a form
 * @param newField 
*/
async function setActiveField(newField: FieldInterface) {
    const curField = {...activeField}

    if (!isEmpty(curField)) {
        await executeHook(curField, 'unload')
    }

    activeField = newField

    await executeHook(newField, 'onload')

    if (!getFieldDataAttr(newField, 'init')) {
        setFieldDataAttr(newField, true, 'init')
        const val = await executeHook(newField, 'defaultValue')
        if (typeof val === "string") {
            await setValue({ label: val, value: val })
        } else {
            await setValue(val)
        }
    }

    // Buttons should react when field is initially loaded
    updateButtonStates(newField, 'default')

    const helpText = await executeHook(newField, 'dynamicHelpText')

    setFieldDataAttr(newField, helpText || newField.helpText, 'helpText')

    const options = await executeHook(newField, 'options')

    setFieldDataAttr(newField, options || [], 'listOptions')

    setFieldDataAttr(activeField, new Date().getTime(), 'intLastTimeLoaded')
}

export default function FieldDataComposable() {
    return {
        activeField,
        fieldData,
        getFieldDataAttr,
        buildAndSetFieldData,
        executeHook,
        setValue,
        computeFieldData,
        clearFieldData,
        setActiveField,
        onFieldCondition,
        updateActiveFieldListOptions
    }
}
