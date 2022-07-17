<template>
    <ion-text
        :key="index"
        color="danger"
        class="ion-padding"
        v-for="(error, index) in data.errors">
       <b> {{error}} </b>
    </ion-text>
    <ion-grid> 
        <ion-row v-for="(item, index) in data.listOptions" :key="index">
            <ion-col>
                <h3> 
                    {{ item.label }}  
                    <span v-if="item.isRequired"> 
                        <ion-text :color="item.value === '' ? 'danger' : ''"> 
                            (*)
                        </ion-text>
                    </span>
                </h3>
            </ion-col>
            <ion-col>
                <ion-segment v-model="item.value">
                    <ion-segment-button :value="true" class="yes-no">
                        YES
                    </ion-segment-button>
                    <ion-segment-button :value="false" class="yes-no"> 
                        NO
                    </ion-segment-button>
                </ion-segment>
            </ion-col>
        </ion-row>
    </ion-grid>
</template>
<script lang="ts">
import { defineComponent, watch } from 'vue'
import {
    IonText,
    IonGrid,
    IonCol,
    IonRow,
    IonSegment,
    IonSegmentButton
} from "@ionic/vue"
import FieldComposable from "@/composables/FieldData"
import { Option } from '@/router/FieldInterfaces'

export default defineComponent({
    components: {
        IonText,
        IonGrid,
        IonCol,
        IonRow,
        IonSegment,
        IonSegmentButton
    },
    setup() {
        const { 
            getActiveFieldData,
            setActiveFieldValue
        } = FieldComposable()
        const data = getActiveFieldData() as any
        watch(() => data.valueClearCount, (v) => {
            if (v) data.listOptions.forEach((i: Option) => i.value = '')
        })
        watch(() => data.listOptions, (items) => {
            const selected = items.every((i: Option) => i.value != '')
            if (selected) {
                setActiveFieldValue(items as Option[])
            } else {
                setActiveFieldValue(null)
            }
        },
        { 
            deep: true 
        })
        return { data }
    }
})
</script>
<style scoped>
ion-segment-button {
  height: 50px;
  margin: 1%;
  font-size: 1.6em;
}
</style>
