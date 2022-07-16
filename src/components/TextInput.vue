<template>
    <ion-item class="ion-padding" style="width:100%">
        <ion-input :autofocus="true" placeholder="Enter value" v-model="val"/>
    </ion-item>
    <ion-text
        class="ion-padding"
         v-for="(error, index) in fieldData.errors" 
        :key="index" 
        color="danger"> 
       <b> {{error}} </b>
    </ion-text>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue'
import FieldComposable from "@/composables/FieldData"
import { Option } from '@/router/FieldInterfaces'
import { 
    IonInput,
    IonItem,
    IonText
} from "@ionic/vue"

export default defineComponent({
    components: {
        IonInput,
        IonItem,
        IonText
    },
    setup() {
        const val = ref('')
        const { getActiveFieldData, setActiveFieldValue } = FieldComposable()
        const fieldData = getActiveFieldData() as any
        onMounted(() => {
            if (fieldData.formValue) {
                const option = fieldData.formValue as Option 
                val.value = `${option.label}`
            }
        })
        watch (() => fieldData.valueClearCount, (v) => {
            if (v) {
                val.value = ''
            }
        })
        watch(() => val.value, (newValue) =>{
            if (newValue) {
                setActiveFieldValue({label: newValue, value: newValue})
            } else {
                setActiveFieldValue(null)
            }
        })

        return { val, fieldData }
    }
})
</script>
