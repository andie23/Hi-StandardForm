import { ref } from 'vue'
import { 
    Option,
    FieldInterface, 
    FieldDataInterface
} from '@/router/FieldInterfaces'
import { isEmpty, isEqual } from "lodash"

const activeField = ref({} as FieldInterface)
const fieldData = ref({} as Record<string, FieldDataInterface>)

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
            {...fieldData.value[field.id]}, 
            {...fieldData.value}
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
    'isDirty') {
    return fieldData.value[field.proxyID || field.id][attr] || null
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
            fieldData.value[field.proxyID] = data
        }
        fieldData.value[field.id] = data

    } else {
        console.warn('Cannot set field data with no mounted field')
    }
}

function updateActiveFieldListOptions(options: Option[]) {
    setFieldDataAttr(activeField.value, options, 'listOptions')
}

function buildAndSetFieldData(fields: FieldInterface[]) {
    fieldData.value = {}
    fields.forEach((field, index) => {
        const initialData = {
            index,
            init: false,
            helpText: '',
            isRequired: false,
            errors: [],
            isAvailable: true,
            computedValue: null,
            listOptions: [], 
            formValue: null,
            defaultValue: null
        }
        if (field.proxyID) {
            fieldData.value[field.proxyID] = initialData
        }
        fieldData.value[field.id] = initialData
   })
}

/**
 * Runs a series of hooks related to writing form values
 * @param val 
 * @returns 
 */
async function setValue(val: Option | Option[]) {
    const field = { ...activeField.value }

    if (isEmpty(field)) {
        return console.warn('No field is active to set value to')
    }

    setFieldDataAttr(field, null, 'errors')

    const valueOk = await executeHook(field, 'onValue')

    if (valueOk != undefined && !valueOk) return

    setFieldDataAttr(field, isEqual(val, getFieldDataAttr(field, 'formValue')), 'isDirty')

    setFieldDataAttr(field, val || null, 'formValue')

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
    const field = {...activeField.value}
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
    const field = {...activeField.value}
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
    const curField = {...activeField.value}

    if (!isEmpty(curField)) {
        await executeHook(curField, 'unload')
    }

    activeField.value = newField

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

    const helpText = await executeHook(newField, 'dynamicHelpText')

    setFieldDataAttr(newField, helpText || newField.helpText, 'helpText')

    const options = await executeHook(newField, 'options')

    setFieldDataAttr(newField, options || [], 'listOptions')

    setFieldDataAttr(activeField.value, new Date().getTime(), 'intLastTimeLoaded')
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
