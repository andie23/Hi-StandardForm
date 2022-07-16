<template>
    <ion-list> 
        <ion-item v-for="(item, index) in data.listOptions" 
            :key="index"> 
            <ion-label> {{item.label}} </ion-label>
            <ion-label> <b>{{item.value}}</b> </ion-label>
        </ion-item>
    </ion-list>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import {
    IonList,
    IonItem,
    IonLabel,
} from "@ionic/vue"
import FieldComposable from "@/composables/FieldData"

export default defineComponent({
    components: {
        IonList,
        IonItem,
        IonLabel
    },
    setup() {
      const { getActiveFieldData } = FieldComposable()
      const data = getActiveFieldData() as any
      return { data }          
    },
})
</script>
