const ARMY_SIZE = 25

let battlefields = []
let army = [4,4,4,4,4]
let time_remaining = 0

function build_army(){
	let new_army = []
	let army_total = 0
	
	for(let bf of battlefields){
		let val = Number(bf.val())
		new_army.push(val)
		army_total += val

		if(isNaN(val) || val < 0 || army_total > ARMY_SIZE){
			roll_back()
			return false
		}
	}
	army = new_army
	$("#remaining").text(ARMY_SIZE - army_total)
	console.log(army, army_total)
}

function roll_back(){
	console.log("Roll back")
	for(let i=0; i<army.length; i++){
		$(`#bf${i}`).val(army[i])
	}

	$("#remaining").text(ARMY_SIZE - army.reduce((a,b) => a+b))
}

function random_army(){
	let remaining = ARMY_SIZE
	let new_army = new Array(5).fill(0)

	while(remaining){
		new_army[Math.floor(Math.random()*new_army.length)]++
		remaining--
	}

	return new_army
}

$(document).ready(()=>{
	console.log("jQuery?")

	function send_army(){
		socket.emit("update_army", army)
	}

	const socket = io.connect()

	for(var i = 0; i <= 4; i++){
		battlefields.push($(`#bf${i}`))
	}

	build_army()
	send_army()

	$(".battlefield").change(function() {
		build_army()
		send_army()
	})

	$("button").click(() => {
		army = random_army()
		roll_back()
		send_army()
	})

	socket.on("winner", () => $("#results").text("You win!"))

	socket.on("loser", () => $("#results").text("You lose!"))

	socket.on("results", msg => {
		$("#results").text(msg)
		setTimeout(() => $("#results").text(""), 5000)
	})

	socket.on("time_remaining", time => {
		time_remaining = time
	})

	setInterval(() => {
		time_remaining -= 10
		if (time_remaining >= 0){
			let seconds_left = Math.ceil(time_remaining/1000)
			$("#next_game").text(`${seconds_left} second${seconds_left > 1 ? 's' : ''}`)
		}
	}, 10)
})