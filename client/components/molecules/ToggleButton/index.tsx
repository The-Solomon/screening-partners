export default defineComponent({
    name: 'ToggleButton',
    props: {
        isChecked: {
            type: Boolean,
            default: false,
            required: false
        }
    },
    setup(props) {
        const isChecked = ref<boolean>(props.isChecked);

        return isChecked;
    },
    render() {
        const slot = useSlots().default?.();

        return (
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" class="sr-only peer" checked={this.isChecked}/>
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                { slot }
            </label>
        );
    },
});
