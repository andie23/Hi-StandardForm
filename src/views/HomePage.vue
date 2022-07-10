<template>
  <ion-page>
    <multistep-form
        :fields="fields"
        :onFinish="onFinish"
        :onCancel="onCancel"        
      >
      <template v-slot="{id, type}"> 
        <keep-alive>
          <component :key="id" :is="type"/>
        </keep-alive>
      </template>
    </multistep-form>
  </ion-page>
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import TextInput from "@/components/TextInput.vue"
import MultistepForm from "@/forms/MultistepForm.vue"
import { FieldDataInterface, FieldInterface } from '@/router/FieldInterfaces';

export default defineComponent({
  name: 'HomePage',
  components: {
    IonPage,
    TextInput,
    MultistepForm
  },
  setup() {
    const fields: FieldInterface[] = [
      {
        id: 'first_name',
        helpText: 'First name',
        type: 'text-input',
        isRequired: () => true
      },
      {
        id: 'last_name',
        helpText: 'Last name',
        type: 'text-input',
        isRequired: () => true
      }
    ]
    function onFinish(data: Record<string, FieldDataInterface>) {
      console.log('onFinish', data)
    }
    function  onCancel() {
      console.log('Cancel button pressed!')
    }
    return {
      fields,
      onFinish,
      onCancel
    }
  }
});
</script>
