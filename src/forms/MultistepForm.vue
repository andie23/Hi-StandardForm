<template>
    <ion-page> 
        <ion-header> 
            <ion-toolbar>
                <ion-title :color="errors.length ? 'danger' : ''">
                    {{ helpText }} <b v-if="isRequired">(*)</b>
                </ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <keep-alive>
                <component :key="activeFieldName" v-bind:is="fieldType"/>
            </keep-alive>
        </ion-content>
        <ion-footer>
            <ion-toolbar color="dark">
                <ion-button
                    v-for="(btn, index) in footerBtns" 
                    :key="index"
                    v-show="btn.visible"
                    :slot="btn.slot"
                    :class="btn.cssClass"
                    :color="btn.color"
                    :size="btn.size"
                    :disabled="btn.disabled"
                    @click="onBtnClick(btn)">
                {{ btn.name }}
                </ion-button>
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>
<script lang="ts">
import { 
    computed, 
    defineComponent, 
    PropType, 
    ref, 
    watch 
} from 'vue'
import {
    IonPage,
    IonHeader,
    IonTitle,
    IonContent,
    IonToolbar,
    IonFooter,
    IonButton
} from "@ionic/vue"
import FieldDataComposable from "@/composables/FieldData"
import { 
    FieldDataButtonProps, 
    FieldInterface, 
    Option 
} from '@/router/FieldInterfaces'
import { isEmpty } from 'lodash'

export default defineComponent({
    name: 'MultistepForm',
    emits: ['onNewActiveField'],
    components: {
        IonPage,
        IonHeader,
        IonTitle,
        IonContent,
        IonToolbar,
        IonFooter,
        IonButton
    },
    props: {
        onFinish: {
            type: Function,
            required: true
        },
        activeField: {
            type: String,
            default: ''
        },
        fields: {
            type: Object as PropType<FieldInterface[]>,
            required: true
        },
        onCancel: {
            type: Function,
            required: false
        }
    },
    setup(prop, { emit }) {
        const {
            fieldData,
            activeFieldName,
            getActiveFieldData,
            getFieldDataAttr,
            executeHook,
            buildAndSetFieldData,
            computeFieldData,
            onFieldCondition,
            setActiveFieldValue,
            setActiveField,
            clearFieldData,
            updateActiveFieldListOptions
        } = FieldDataComposable()

        function onBtnClick(btn: FieldDataButtonProps) {
            const handlers = btn.btnRef.clickHandler
            const value = {...fieldData[activeFieldName.value]}
            const data = {...fieldData}

            if (typeof handlers.addValue === 'function') {
                setActiveFieldValue(handlers.addValue(value, data) as Option | Option [])
            }

            if (typeof handlers.doAction === 'function') {
                handlers.doAction(value, data)
            }

            if (typeof handlers.updateListOptions === 'function') {
                updateActiveFieldListOptions(
                    handlers.updateListOptions(value, data) as Option[]
                )
            }
        }

        async function finish() {
            try {
                if (typeof prop.onFinish === 'function') {
                    if ((await computeFieldData())) {
                        await prop.onFinish(fieldData)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }

        async function goNext() {
            let initialIndex = 0
            if (!isEmpty(activeFieldName.value)) {
                if ((await computeFieldData())) {
                    initialIndex = (getFieldDataAttr(activeFieldName.value, 'index') || 0) + 1 // increment to next field
                } else {
                    return
                }
            }
            const totalFields = prop.fields?.length || 0
            if (initialIndex <= totalFields) {
                for (let i=initialIndex; i < totalFields; ++i) {
                    const field = prop.fields[i]
                    if (!(await onFieldCondition(`${field.id}`))) {
                        continue
                    }
                    // Close the form here if its final page
                    if ((await executeHook(`${field.id}`, 'exitsForm'))) {
                        break
                    }
                    await setActiveField(`${field.id}`)
                    console.log(field.id)
                    return
                }
                finish()
            }
        }

        function goBack() {
            let initialIndex = 0
            if (isEmpty(activeFieldName.value)) {
                initialIndex = getFieldDataAttr(activeFieldName.value, 'index')
            }
            for (let i=initialIndex; i >= 0; --i) {
                const field = prop.fields[i]
                if (getFieldDataAttr(activeFieldName.value, 'isAvailable')) {
                    return setActiveField(`${field.id}`)
                }
            }
        }

        async function navTo(fieldID: string) {
            if (fieldID === '_NEXT_FIELD_') {
                await goNext()
            } else {
                if (fieldID in fieldData) {
                    setActiveField(fieldID)
                } else {
                    console.warn(`field ${fieldID} not found!`)
                }
            }
            emit('onNewActiveField', fieldID)    
        }

        watch(() => prop.activeField, (name) => {
            if (name) navTo(name)
        })

        // Initiate and render new fields
        watch(() => prop.fields, (fields) => {
            if (!isEmpty(fields)) {
                buildAndSetFieldData(
                    fields,
                    [
                       {
                            index: 0,
                            name: 'Cancel',
                            slot: 'start',
                            color: 'danger',
                            clickHandler: {
                                doAction() {
                                   if (typeof prop.onCancel === 'function') {
                                       prop.onCancel()
                                   }
                                }
                            }
                       },
                       {
                           index: 20, 
                           name: 'Clear',
                           slot: 'end',
                           color: 'warning',
                           clickHandler: {
                               doAction() {
                                   clearFieldData(activeFieldName.value)
                               }
                           }
                       },
                       {
                           index: 21,
                           name: 'Back',
                           slot: 'end',
                           clickHandler: {
                               doAction() {
                                    goBack()
                               }
                           }
                       },
                       {
                            index: 22,
                            name: 'Next',
                            slot: 'end',
                            color: 'success',
                            clickHandler: {
                                doAction() {
                                    goNext()
                                }
                            }
                       },
                    ]
                )
                if (typeof prop.activeField === 'string' && prop.activeField) {
                    navTo(prop.activeField)
                } else {
                    navTo('_NEXT_FIELD_')
                }
            }
        }, 
        {
            deep: true, 
            immediate: true
        })

        const activeData = ref({} as any)

        watch(() => activeFieldName.value, (f) => {
            if (f) {
                activeData.value = getActiveFieldData()
            }
        })
        const helpText = computed(() => activeData.value.helpText || '-')
        const fieldType = computed (() =>  activeData.value?._def?.type || '')
        const footerBtns = computed (() => activeData.value?.navButtonProps || [])
        const isRequired = computed (() => activeData.value?.isRequired || false)
        const errors = computed(() => activeData.value.errors || [])
        return {
            errors,
            isRequired,
            activeFieldName,
            helpText,
            footerBtns,
            fieldType,
            activeData,
            onBtnClick
        }
    }
})
</script>
