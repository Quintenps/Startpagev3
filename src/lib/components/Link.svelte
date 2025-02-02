<script lang="ts">
  export let url: string;
  export let title: string;
</script>

<a
  href={url}
  class="text-gray-900 transition ease-in-out bg-white hover:bg-gray-100 border border-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1 dark:focus:ring-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-yellow-200 dark:hover:text-black dark:hover:border-yellow-200"
>
  {title}
</a>
