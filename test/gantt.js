const testData = [
	{
		id: '1',
		name: 'N1',
		start: new Date('2025-07-14'),
		end: new Date('2025-07-18'),
		progress: 50
	},
	{
		id: '2',
		name: 'N2',
		start: new Date('2025-07-15'),
		end: new Date('2025-07-16'),
		progress: 25,
		dependencies: '1'
	},
	{
		id: '3',
		name: 'N3',
		start: new Date('2025-07-16'),
		end: new Date('2025-07-17'),
		progress: 75,
        dependencies: '1,2'
	}
]

const chart = new Gantt('#gantt-chart', testData, {
	container_height: 600,
	popup_on: 'hover'
})
