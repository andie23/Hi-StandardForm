<template>
    <ion-item class="ion-padding ion-text-center" style="width:100%">
        <ion-input placeholder="Filter list" v-model="filter"/>
    </ion-item>
    <ion-text
        class="ion-padding"
         v-for="(error, index) in data.errors" 
        :key="index" 
        color="danger"> 
       <b> {{error}} </b>
    </ion-text>
    <ion-list class="ion-padding">
        <ion-radio-group v-model="selection">
            <ion-item
                :key="index"
                v-for="(item, index) in filtered">
                <ion-radio slot="start" :value="item"></ion-radio>
                <ion-label> {{ item.label }} </ion-label>
            </ion-item>
        </ion-radio-group>
    </ion-list>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import {
    IonInput,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonRadio,
    IonRadioGroup
} from "@ionic/vue"
import FieldComposable from "@/composables/FieldData"
import { Option } from '@/router/FieldInterfaces'

export default defineComponent({
    components: {
        IonInput,
        IonList,
        IonItem,
        IonLabel,
        IonText,
        IonRadioGroup,
        IonRadio
    },
    setup() {
        const filter = ref('')
        const selection = ref({} as Option | unknown)
        const { getActiveFieldData, setActiveFieldValue } = FieldComposable()
        const data = getActiveFieldData() as any
        onMounted(() => {
            if (data.formValue) {
                selection.value = data.formValue as Option
            }
        })
        watch(() => data.valueClearCount, (v) => {
            if (v) selection.value = null
        })
        watch(() => selection.value, (newValue) =>{
            if (newValue) {
                setActiveFieldValue(newValue as Option)
            } else {
                setActiveFieldValue(null)
            }
        })
        const filtered = computed(() => {
            if (filter.value) {
                return data.listOptions.filter((i: Option) => {
                    return RegExp(filter.value, 'i').test(`${i.label}`)
                })
            }
            return data.listOptions
        })
        return { selection, filter, data, filtered }          
    },
})
</script>
