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
        <ion-item v-for="(item, index) in filtered" :key="index">
            <ion-checkbox slot="start" v-model="item.isChecked"></ion-checkbox>
            <ion-label> {{ item.label }} </ion-label>
        </ion-item>
    </ion-list>
</template>
<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import {
    IonInput,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonCheckbox
} from "@ionic/vue"
import FieldComposable from "@/composables/FieldData"
import { Option } from '@/router/FieldInterfaces'
import { isEmpty } from 'lodash'

export default defineComponent({
    components: {
        IonInput,
        IonList,
        IonItem,
        IonLabel,
        IonText,
        IonCheckbox
    },
    setup() {
        const filter = ref('')
        const { getActiveFieldData, setActiveFieldValue } = FieldComposable()
        const data = getActiveFieldData() as any
        watch(() => data.valueClearCount, (v) => {
            if (v) data.listOptions.forEach((i: Option) => i.isChecked = false)
        })
        watch(() => data.listOptions, (items) =>{
            const checked = items.filter((i: Option) => i.isChecked)
            if (!isEmpty(checked)) {
                setActiveFieldValue(checked as Option[])
            } else {
                setActiveFieldValue(null)
            }
        }, { deep: true })
        const filtered = computed(() => {
            if (filter.value) {
                return data.listOptions.filter((i: Option) => {
                    return RegExp(filter.value, 'i').test(`${i.label}`)
                })
            }
            return data.listOptions
        })
        return { filter, data, filtered }          
    },
})
</script>
