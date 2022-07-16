<template>
  <ion-page>
    <multistep-form
        :fields="fields"
        :onFinish="onFinish"
        :onCancel="onCancel">
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
    MultistepForm
  },
  setup() {
    const fields: FieldInterface[] = [
      {
        id: 'first_name',
        helpText: 'First name',
        type: TextInput,
        isRequired: () => true
      },
      {
        id: 'last_name',
        helpText: 'Last name',
        type: TextInput,
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
