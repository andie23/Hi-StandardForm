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
            <ion-toolbar>
                <!-- Footer buttons come here --> 
            </ion-toolbar>
        </ion-footer>
    </ion-page>
</template>

<script lang="ts">
import { defineComponent, PropType, watch } from 'vue'
import {
    IonPage,
    IonHeader,
    IonTitle,
    IonContent,
    IonToolbar,
    IonFooter
} from "@ionic/vue"
import FieldDataComposable from "@/composables/FieldData"
import { FieldInterface } from '@/router/FieldInterfaces'
import { find, isEmpty } from 'lodash'

export default defineComponent({
    emits: ['onNewActiveField'],
    components: {
        IonPage,
        IonHeader,
        IonTitle,
        IonContent,
        IonToolbar,
        IonFooter
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
        cancelDestinationPath: {
            type: String
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
            clearFieldData
        } = FieldDataComposable()

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
            if (!isEmpty(activeField.value)) {
                if ((await computeFieldData())) {
                    initialIndex = (getFieldDataAttr(activeField.value, 'index') || 0) + 1 // increment to next field
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
            if (isEmpty(activeField.value)) {
                initialIndex = getFieldDataAttr(activeField.value, 'index')
            }
            for (let i=initialIndex; i >= 0; --i) {
                const field = prop.fields[i]
                if (getFieldDataAttr(activeField.value, 'isAvailable')) {
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
                buildAndSetFieldData(fields)
                if (typeof prop.activeFieldName === 'string' && prop.activeFieldName) {
                    navTo(prop.activeFieldName)
                } else {
                    navTo('_NEXT_FIELD_')
                }
            }
        }, {
            deep: true, 
            immediate: true
        })
    }
})
</script>
