import { reactive, ref } from 'vue'
import { 
    Option,
    FieldInterface, 
    FieldDataInterface,
    FieldNavButton,
    FieldDataButtonProps,
} from '@/router/FieldInterfaces'
import { isEmpty, isEqual } from "lodash"

const activeFieldName = ref('' as string)
const fieldData = reactive({} as Record<string, FieldDataInterface>)

/**
 * Run callback hooks defined for a field. Each hook is given field parameters
 * @param field 
 * @param hook 
 * @returns 
 */
async function executeHook(
    fieldName: string,
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
    ) 
    {
        if (fieldData[fieldName] && fieldData[fieldName]._def[hook]) {
            if (typeof fieldData[fieldName]._def[hook] === 'function') {
                return fieldData[fieldName]._def[hook](
                    {...fieldData[fieldName]},
                    {...fieldData}
                )
            } else {
                console.warn(`Invalid hook ${hook}`)
            }
        }
        return null
    }

function getFieldDataAttr(
    fieldName: string, 
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
    'valueClearCount' |
    'isDirty') {
    if (fieldName in fieldData) {
        return fieldData[fieldName][attr]
    }
    return null
}

/**
 * Changes buttons states based on specified event. 
 * This can be either to disable, change color or show/hide based on
 * whether the value changed or if it's  a default state
 * @param field 
 * @param event 
 */
function updateButtonStates(fieldName: string, event: 'default' | 'onValue') {
    const buttons = getFieldDataAttr(fieldName, 'navButtonProps')
    buttons.forEach((btn: FieldDataButtonProps) => {
        if (btn.btnRef?.state) {
            const states: Record<string, any> = btn.btnRef?.state || {}
            for (const p in states) {
                const state = states[p]
                const data = fieldData[fieldName]
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
    fieldName: string,
    data: any,
    attr: 
    'valueClearCount' |
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
        if (fieldData[fieldName]?._def?.proxyID && canUpdateParentProxy) {
            fieldData[fieldData[fieldName]._def.proxyID][attr] = data
        }
        fieldData[fieldName][attr] = data
}

function updateActiveFieldListOptions(options: Option[]) {
    setFieldDataAttr(activeFieldName.value, options, 'listOptions')
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
            helpText: field.helpText,
            isRequired: false,
            errors: [],
            isAvailable: true,
            computedValue: null,
            listOptions: [], 
            formValue: null,
            defaultValue: null,
            navButtonProps: [],
            valueClearCount: 0,
            _def: field
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
                    color: b.color as any,
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
async function setActiveFieldValue(val: Option | Option[] | null) {
    const fieldName = activeFieldName.value

    if (isEmpty(fieldName)) {
        return console.warn('No field is active to set value to')
    }

    setFieldDataAttr(fieldName, null, 'errors')

    const valueOk = await executeHook(fieldName, 'onValue')

    if (valueOk != undefined && !valueOk) return

    setFieldDataAttr(fieldName, isEqual(val, getFieldDataAttr(fieldName, 'formValue')), 'isDirty')

    setFieldDataAttr(fieldName, val || null, 'formValue')

    // Buttons should react when new value is added
    updateButtonStates(fieldName, 'onValue')

    const listUpdate = await executeHook(fieldName, 'onValueUpdate')

    if (listUpdate) setFieldDataAttr(fieldName, listUpdate, 'listOptions', false)

    const helpText = await executeHook(fieldName, 'updateHelpTextOnValue')

    setFieldDataAttr(fieldName, helpText || getFieldDataAttr(fieldName, 'helpText'), 'helpText')
}

/**
 * Handles transitional operations to ensure data validity and 
 * handles value computations
 * @returns 
 */
async function computeFieldData() {
    const field = activeFieldName.value
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

function clearFieldData(fieldName: string) {
    const clearCount = getFieldDataAttr(fieldName, 'valueClearCount')
    setFieldDataAttr(fieldName, null, 'errors')
    setFieldDataAttr(fieldName, null, 'formValue')
    setFieldDataAttr(fieldName, null, 'computedValue')
    setFieldDataAttr(fieldName, clearCount + 1, 'valueClearCount')
}

/**
 * Manage conditional states
 * @param field 
 * @returns 
 */
async function onFieldCondition(field: string) {
    try {
        const isAvailable = await executeHook(field, 'condition')
        if (isAvailable === null || isAvailable) {
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
async function setActiveField(newField: string) {
    const curField = activeFieldName.value

    if (!isEmpty(curField)) {
        await executeHook(curField, 'unload')
    }

    activeFieldName.value = newField

    await executeHook(newField, 'onload')

    if (!getFieldDataAttr(newField, 'init')) {
        setFieldDataAttr(newField, true, 'init')
        const val = await executeHook(newField, 'defaultValue')
        if (typeof val === "string") {
            await setActiveFieldValue({ label: val, value: val })
        } else {
            await setActiveFieldValue(val)
        }
    }

    // Buttons should react when field is initially loaded
    updateButtonStates(newField, 'default')

    const helpText = await executeHook(newField, 'dynamicHelpText')

    if (helpText != null) {
        setFieldDataAttr(newField, helpText, 'helpText')
    }

    const options = await executeHook(newField, 'options')

    setFieldDataAttr(newField, options || [], 'listOptions')

    setFieldDataAttr(activeFieldName.value, new Date().getTime(), 'intLastTimeLoaded')
}

function getActiveFieldData() {
    if (activeFieldName.value && fieldData) {
        return fieldData[activeFieldName.value]
    }
    return {}
}

export default function FieldDataComposable() {
    return {
        activeFieldName,
        fieldData,
        getActiveFieldData,
        getFieldDataAttr,
        buildAndSetFieldData,
        executeHook,
        setActiveFieldValue,
        computeFieldData,
        clearFieldData,
        setActiveField,
        onFieldCondition,
        updateActiveFieldListOptions
    }
}
