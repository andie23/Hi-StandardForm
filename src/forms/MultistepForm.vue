<template>
    <ion-page> 
        <ion-header> 
            <ion-toolbar>
                <ion-title> 
                    <!--Title goes here-->
                </ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content> 
            <!-- Dynamic form elements come here -->
        </ion-content>
        <ion-footer>
            <ion-toolbar color="dark">
                <ion-button v-for="(btn, index) in footerBtns" 
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
import { FieldDataButtonProps, FieldInterface, Option } from '@/router/FieldInterfaces'
import { find, isEmpty } from 'lodash'

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
        activeFieldName: {
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
            activeField,
            getFieldDataAttr,
            executeHook,
            buildAndSetFieldData,
            computeFieldData,
            onFieldCondition,
            setActiveField,
            setValue,
            clearFieldData,
            updateActiveFieldListOptions
        } = FieldDataComposable()

        function onBtnClick(btn: FieldDataButtonProps) {
            const handlers = btn.btnRef.clickHandler
            const value = {...fieldData[activeField.id]}
            const data = {...fieldData}

            if (typeof handlers.addValue === 'function') {
                setValue(handlers.addValue(value, data) as Option | Option [])
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
                        await prop.onFinish(fieldData.value)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }

        async function goNext() {
            let initialIndex = 0
            if (!isEmpty(activeField)) {
                if ((await computeFieldData())) {
                    initialIndex = (getFieldDataAttr(activeField, 'index') || 0) + 1 // increment to next field
                } else {
                    return
                }
            }
            const totalFields = prop.fields?.length || 0
            if (initialIndex <= totalFields) {
                for (let i=initialIndex; i < totalFields; ++i) {
                    const field = prop.fields[i]
                    if (!(await onFieldCondition(field))) {
                        continue
                    }
                    // Close the form here if its final page
                    if ((await executeHook(field, 'exitsForm'))) {
                        break
                    }
                    await setActiveField(field)
                    return
                }
                finish()
            }
        }

        function goBack() {
            let initialIndex = 0
            if (isEmpty(activeField)) {
                initialIndex = getFieldDataAttr(activeField, 'index')
            }
            for (let i=initialIndex; i >= 0; --i) {
                const field = prop.fields[i]
                if (getFieldDataAttr(activeField, 'isAvailable')) {
                    setActiveField(field)
                    return
                }
            }
        }

        async function navTo(fieldID: string) {
            if (fieldID === '_NEXT_FIELD_') {
                await goNext()
            } else {
                const field = find(prop.fields, { id: fieldID })
                if (field) {
                    setActiveField(field)
                } else {
                    console.warn(`field ${fieldID} not found!`)
                }
            }
            emit('onNewActiveField', fieldID)    
        }

        watch(() => prop.activeFieldName, (name) => {
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
                                   clearFieldData()
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
                if (typeof prop.activeFieldName === 'string' && prop.activeFieldName) {
                    navTo(prop.activeFieldName)
                } else {
                    navTo('_NEXT_FIELD_')
                }
            }
        }, 
        {
            deep: true, 
            immediate: true
        })
        const footerBtns = computed(() => {
            return !isEmpty(activeField) 
                ? fieldData[activeField.id].navButtonProps
                : []
        })
        return {
            footerBtns,
            onBtnClick
        }
    }
})
</script>
